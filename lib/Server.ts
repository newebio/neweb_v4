import { Response } from "express";
import { Socket } from "socket.io";
import { IApplication, IRequest, ISeanceDumpInfo, NewebGlobalStore } from "../typings";
import PageRenderer from "./PageRenderer";
import SeancesManager from "./SeancesManager";
import SessionsManager from "./SessionsManager";
import { parseRequestCookies } from "./util";

export interface IServerConfig {
    app: IApplication;
    store: NewebGlobalStore;
    logger: typeof console;
}
class Server {
    constructor(protected config: IServerConfig) { }
    /**
     * Схема работы:
     * Получаем контекст сессии, который нужен для работы роутера
     * Создаем новый класс роутера, передаем в него запрос и ждем, когда появится маршрут
     * Очищаем роутер, он больше не понадобится
     * Если тип маршрута - NotFound или Redirect, то посылаем соответствующий ответ клиенту (404 или 302)
     * Создаем новый сеанс (Seans) и загружаем в него страницу, ждем формирования страницы
     * С помощью серверного рендеринга получаем код страницы в виде html-строки
     * Заполняем шаблон ответа кодом страницы, мета-информацией и информацией о сеансе
     * Отправляем ответ клиенту
     */
    public async onRequest(request: IRequest, res: Response) {




        const seancesManager = new SeancesManager({
            app: this.config.app,
            store: this.config.store,
        });
        // handling route of page
        // create new seans with RoutePage
        const { seanceId, seance } = await seancesManager.createSeance({ sessionId, request });
        await seance.loadPage(seanceId, route.page);
        // get info about seance
        const seanceDump = {
            seanceId,
            page: await this.config.store.get("seance-current-page", seanceId),
        };
        const page = seanceDump.page;
        // render page on server
        const pageRenderer = new PageRenderer({
            app: this.config.app,
        });
        const { html } = await pageRenderer.render(seanceDump.page);
        const filledHtml = await this.config.app.fillTemplate(html,
            { title: page.title, meta: page.meta }, seanceDump);

        // Add session info to response
        await sessionsManager.enrichResponse(sessionId, res);
        // send html and seans'es info to client
        res.status(200).send(filledHtml);
    }
    public async onNewConnection(socket: Socket) {
        const socketId = this.generateSocketId();
        this.config.store.setObject("socket", socketId, socket);
        // Ждем первое сообщение от клиента
        const initializeCallback = (params: any, cb: any) => this.initialize(socketId, params, cb);
        // this.config.store.setObject("socket-event-callback", [socketId, "initialize"], initializeCallback);
        socket.on("initialize", initializeCallback);
        // Либо сообщение о восстановлении сеанса
        const recoveryCallback = (params: ISeanceDumpInfo, cb: any) => this.recovery(socketId, params, cb);
        socket.on("recovery", recoveryCallback);
        // this.config.store.setObject("socket-event-callback", [socketId, "recovery"], initializeCallback);
        // При разрыве соединения, сообщаем сеансу об этом и отписываемся от сокета
        socket.on("disconnect", () => this.disconnect(socketId));
        socket.on("error", () => this.disconnect(socketId));
    }
    protected generateSocketId() {
        return (+new Date()) + Math.round(Math.random() * 100000).toString();
    }
    // socketId: string, params: ISeanceDumpInfo, cb: () => void
    protected async recovery(_: string, __: ISeanceDumpInfo, ___: any) {
        //
    }
    protected async initialize(
        socketId: string,
        params: { seanceId: string; }, cb: () => void) {
        const socket = await this.config.store.getObject("socket", socketId);
        // Обогощяем запрос, распарсивая печеньки
        await parseRequestCookies(socket.request);
        // create request from socket-info
        const request = {
            clientIpAddress: socket.conn.remoteAddress,
            cookies: socket.request.cookies,
            headers: socket.request.headers,
            url: "",
            hostname: "",
        };
        // get session by request
        const sessionsManager = new SessionsManager({
            store: this.config.store,
        });
        const sessionId = await sessionsManager.resolveSessionIdByRequest(request);
        // connect seans to socket
        const seancesManager = new SeancesManager({
            app: this.config.app,
            store: this.config.store,
        });
        await seancesManager.connect({
            seanceId: params.seanceId,
            sessionId,
            socketId,
        });
        cb();
    }
    protected async disconnect(socketId: string) {
        const socket = await this.config.store.getObject("socket", socketId);
        socket.removeAllListeners();
        const seancesManager = new SeancesManager({
            app: this.config.app,
            store: this.config.store,
        });
        await seancesManager.disconnect(socketId);
    }
}
export default Server;
