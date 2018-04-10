"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const PageRenderer_1 = require("./PageRenderer");
const SeancesManager_1 = require("./SeancesManager");
const SessionsManager_1 = require("./SessionsManager");
const util_1 = require("./util");
class Server {
    constructor(config) {
        this.config = config;
    }
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
    onRequest(request, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const seancesManager = new SeancesManager_1.default({
                app: this.config.app,
                store: this.config.store,
            });
            // handling route of page
            // create new seans with RoutePage
            const { seanceId, seance } = yield seancesManager.createSeance({ sessionId, request });
            yield seance.loadPage(seanceId, route.page);
            // get info about seance
            const seanceDump = {
                seanceId,
                page: yield this.config.store.get("seance-current-page", seanceId),
            };
            const page = seanceDump.page;
            // render page on server
            const pageRenderer = new PageRenderer_1.default({
                app: this.config.app,
            });
            const { html } = yield pageRenderer.render(seanceDump.page);
            const filledHtml = yield this.config.app.fillTemplate(html, { title: page.title, meta: page.meta }, seanceDump);
            // Add session info to response
            yield sessionsManager.enrichResponse(sessionId, res);
            // send html and seans'es info to client
            res.status(200).send(filledHtml);
        });
    }
    onNewConnection(socket) {
        return __awaiter(this, void 0, void 0, function* () {
            const socketId = this.generateSocketId();
            this.config.store.setObject("socket", socketId, socket);
            // Ждем первое сообщение от клиента
            const initializeCallback = (params, cb) => this.initialize(socketId, params, cb);
            // this.config.store.setObject("socket-event-callback", [socketId, "initialize"], initializeCallback);
            socket.on("initialize", initializeCallback);
            // Либо сообщение о восстановлении сеанса
            const recoveryCallback = (params, cb) => this.recovery(socketId, params, cb);
            socket.on("recovery", recoveryCallback);
            // this.config.store.setObject("socket-event-callback", [socketId, "recovery"], initializeCallback);
            // При разрыве соединения, сообщаем сеансу об этом и отписываемся от сокета
            socket.on("disconnect", () => this.disconnect(socketId));
            socket.on("error", () => this.disconnect(socketId));
        });
    }
    generateSocketId() {
        return (+new Date()) + Math.round(Math.random() * 100000).toString();
    }
    // socketId: string, params: ISeanceDumpInfo, cb: () => void
    recovery(_, __, ___) {
        return __awaiter(this, void 0, void 0, function* () {
            //
        });
    }
    initialize(socketId, params, cb) {
        return __awaiter(this, void 0, void 0, function* () {
            const socket = yield this.config.store.getObject("socket", socketId);
            // Обогощяем запрос, распарсивая печеньки
            yield util_1.parseRequestCookies(socket.request);
            // create request from socket-info
            const request = {
                clientIpAddress: socket.conn.remoteAddress,
                cookies: socket.request.cookies,
                headers: socket.request.headers,
                url: "",
                hostname: "",
            };
            // get session by request
            const sessionsManager = new SessionsManager_1.default({
                store: this.config.store,
            });
            const sessionId = yield sessionsManager.resolveSessionIdByRequest(request);
            // connect seans to socket
            const seancesManager = new SeancesManager_1.default({
                app: this.config.app,
                store: this.config.store,
            });
            yield seancesManager.connect({
                seanceId: params.seanceId,
                sessionId,
                socketId,
            });
            cb();
        });
    }
    disconnect(socketId) {
        return __awaiter(this, void 0, void 0, function* () {
            const socket = yield this.config.store.getObject("socket", socketId);
            socket.removeAllListeners();
            const seancesManager = new SeancesManager_1.default({
                app: this.config.app,
                store: this.config.store,
            });
            yield seancesManager.disconnect(socketId);
        });
    }
}
exports.default = Server;
