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
const cookieParser = require("cookie-parser");
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
            // get session's context
            const sessionId = yield this.config.sessionsManager.resolveSessionIdByRequest(request);
            const sesionContext = yield this.config.sessionsManager.getSessionContext(sessionId);
            // get current route
            const RouterClass = yield this.config.app.getRouterClass();
            const router = new RouterClass({
                app: this.config.app,
                context: yield this.config.app.getContext(),
                session: sesionContext,
                request,
            });
            router.navigate({ request });
            const route = yield router.waitRoute();
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
            const seance = yield this.config.seancesManager.createSeance({ sessionId, request });
            yield seance.loadPage(route.page);
            // get info about seance
            const seanceDump = seance.dumpToJson();
            const page = seanceDump.page;
            // render page on server
            const { html } = yield this.config.pageRenderer.render(seanceDump.page);
            const filledHtml = yield this.config.app.fillTemplate(html, { title: page.title, meta: page.meta }, seanceDump);
            // Add session info to response
            yield this.config.sessionsManager.enrichResponse(sessionId, res);
            // send html and seans'es info to client
            res.status(200).send(filledHtml);
        });
    }
    onNewConnection(socket) {
        return __awaiter(this, void 0, void 0, function* () {
            // Обогощяем запрос, распарсивая печеньки
            yield new Promise((resolve) => {
                cookieParser()(socket.request, {}, resolve);
            });
            // Ждем первое сообщение от клиента
            socket.on("initialize", (params, cb) => __awaiter(this, void 0, void 0, function* () {
                // create request from socket-info
                const request = {
                    clientIpAddress: socket.conn.remoteAddress,
                    cookies: socket.request.cookies,
                    headers: socket.request.headers,
                    url: "",
                    hostname: "",
                };
                // get session by request
                const sessionId = yield this.config.sessionsManager.resolveSessionIdByRequest(request);
                // connect seans to socket
                yield this.config.seancesManager.connect({
                    seanceId: params.seanceId,
                    sessionId,
                    socket,
                });
                cb();
            }));
            // При разрыве соединения, сообщаем сеансу об этом и отписываемся от сокета
            socket.on("disconnect", () => this.disconnect(socket));
            socket.on("error", () => this.disconnect(socket));
        });
    }
    disconnect(socket) {
        return __awaiter(this, void 0, void 0, function* () {
            socket.removeAllListeners();
            yield this.config.seancesManager.disconnect(socket);
        });
    }
}
exports.default = Server;
