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
const seances_1 = require("./seances");
const sessions_1 = require("./sessions");
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
function onHttpRequest(store, req, response) {
    return __awaiter(this, void 0, void 0, function* () {
        const requestId = (+new Date()).toString() + Math.floor(Math.random() * 10000).toString();
        yield store.setObject("http-request", requestId, {
            type: "object",
            objectType: "app",
            id: "default",
        }, req);
        yield store.setObject("http-response", requestId, {
            type: "object",
            objectType: "app",
            id: "default",
        }, response);
        const request = {
            cookies: req.cookies || {},
            headers: req.headers || {},
            hostname: req.hostname,
            url: req.url,
            clientIpAddress: req.ip,
        };
        yield store.set("request", requestId, request);
        yield onRequest(store, requestId);
    });
}
exports.onHttpRequest = onHttpRequest;
function onRequest(store, requestId) {
    return __awaiter(this, void 0, void 0, function* () {
        const request = yield store.get("request", requestId);
        // get session's context
        const sessionId = yield sessions_1.resolveSessionIdByRequest(store, request);
        const sesionContext = yield sessions_1.getSessionContext(store, sessionId);
        const app = yield store.getObject("app", "default");
        // get current route
        const RouterClass = yield app.getRouterClass();
        const router = new RouterClass({
            context: yield app.getContext(),
            session: sesionContext,
            request,
        });
        router.navigate({ request });
        const route = yield router.waitRoute();
        router.dispose();
        // Handling route
        const res = yield store.getObject("http-response", requestId);
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
        const seanceId = yield seances_1.createSeance(store, { sessionId, request });
        yield seances_1.loadSeancePage(store, seanceId, route.page);
        // get info about seance
        const seanceDump = {
            seanceId,
            page: yield store.get("seance-current-page", seanceId),
        };
        const page = seanceDump.page;
        // render page on server
        const pageRenderer = new PageRenderer_1.default({
            app,
        });
        const { html } = yield pageRenderer.render(seanceDump.page);
        const filledHtml = yield app.fillTemplate(html, { title: page.title, meta: page.meta }, seanceDump);
        // Add session info to response
        yield sessions_1.enrichResponseForSession(store, sessionId, res);
        // send html and seans'es info to client
        res.status(200).send(filledHtml);
    });
}
exports.onRequest = onRequest;
