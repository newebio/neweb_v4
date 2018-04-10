import cookieParser = require("cookie-parser");
import { Response } from "express";
import { Socket } from "socket.io";
import { IApplication, IRequest } from "../typings";
import PageRenderer from "./PageRenderer";
import SeancesManager from "./SeancesManager";
import SessionsManager from "./SessionsManager";

export interface IServerConfig {
    sessionsManager: SessionsManager;
    seancesManager: SeancesManager;
    pageRenderer: PageRenderer;
    app: IApplication;
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
        // get session's context
        const sessionId =
            await this.config.sessionsManager.resolveSessionIdByRequest(request);
        const sesionContext = await this.config.sessionsManager.getSessionContext(sessionId);
        // get current route
        const RouterClass = await this.config.app.getRouterClass();
        const router = new RouterClass({
            app: this.config.app,
            context: await this.config.app.getContext(),
            session: sesionContext,
            request,
        });
        router.navigate({ request });
        const route = await router.waitRoute();
        router.dispose();
        // Handling route
        if (route.type === "redirect") {
            res.header("location", route.url);
            res.sendStatus(302);
            return;
        }
        if (route.type === "notFound") {
            res.status(404).send(route.text);
            return;
        }
        // handling route of page
        // create new seans with RoutePage
        const seance = await this.config.seancesManager.createSeance({ sessionId, request });
        await seance.loadPage(route.page);
        // get info about seance
        const seanceDump = seance.dumpToJson();
        const page = seanceDump.page;
        // render page on server
        const { html } = await this.config.pageRenderer.render(seanceDump.page);
        const filledHtml = await this.config.app.fillTemplate(html,
            { title: page.title, meta: page.meta }, seanceDump);

        // Add session info to response
        await this.config.sessionsManager.enrichResponse(sessionId, res);
        // send html and seans'es info to client
        res.status(200).send(filledHtml);
    }
    public async onNewConnection(socket: Socket) {
        // Обогощяем запрос, распарсивая печеньки
        await new Promise((resolve) => {
            cookieParser()(socket.request, {} as any, resolve);
        });
        // Ждем первое сообщение от клиента
        socket.on("initialize", async (
            params: {
                seanceId: string;
            },
            cb) => {
            // create request from socket-info
            const request = {
                clientIpAddress: socket.conn.remoteAddress,
                cookies: socket.request.cookies,
                headers: socket.request.headers,
                url: "",
                hostname: "",
            };
            // get session by request
            const sessionId = await this.config.sessionsManager.resolveSessionIdByRequest(request);
            // connect seans to socket
            await this.config.seancesManager.connect({
                seanceId: params.seanceId,
                sessionId,
                socket,
            });
            cb();
        });
        // При разрыве соединения, сообщаем сеансу об этом и отписываемся от сокета
        socket.on("disconnect", () => this.disconnect(socket));
        socket.on("error", () => this.disconnect(socket));
    }
    protected async disconnect(socket: Socket) {
        socket.removeAllListeners();
        await this.config.seancesManager.disconnect(socket);
    }
}
export default Server;
