import { Request, Response } from "express";
import { NewebGlobalStore } from "./..";
import PageRenderer from "./PageRenderer";
import { createSeance, loadSeancePage } from "./seances";
import { enrichResponseForSession, getSessionContext, resolveSessionIdByRequest } from "./sessions";

export async function onHttpRequest(store: NewebGlobalStore, req: Request, response: Response) {
    const requestId = (+new Date()).toString() + Math.floor(Math.random() * 10000).toString();
    await store.setObject("http-request", requestId, {
        type: "object",
        objectType: "app",
        id: "default",
    }, req);
    await store.setObject("http-response", requestId, {
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
    await store.create("request", requestId, {
        type: "object",
        objectType: "http-request",
        id: requestId,
    }, request);
    await onRequest(store, requestId);
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
export async function onRequest(store: NewebGlobalStore, requestId: string) {
    const request = await store.get("request", requestId);
    // get session's context
    const sessionId = await resolveSessionIdByRequest(store, request);
    const sesionContext = await getSessionContext(store, sessionId);
    const app = await store.getObject("app", "default");
    // get current route
    const RouterClass = await app.getRouterClass();
    const router = new RouterClass({
        context: await app.getContext(),
        session: sesionContext,
        request,
    });
    router.navigate({ request });
    const route = await router.waitRoute();
    router.dispose();
    // Handling route
    const res = await store.getObject("http-response", requestId);
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
    const seanceId = await createSeance(store, { sessionId, request });
    await loadSeancePage(store, seanceId, route.page);
    // get info about seance
    const seanceDump = {
        seanceId,
        page: await store.get("seance-current-page", seanceId),
    };
    const page = seanceDump.page;
    // render page on server
    const pageRenderer = new PageRenderer({
        app,
    });
    const { html } = await pageRenderer.render(seanceDump.page);
    const filledHtml = await app.fillTemplate(html,
        { title: page.title, meta: page.meta }, seanceDump);

    // Add session info to response
    await enrichResponseForSession(store, sessionId, res);
    // send html and seans'es info to client
    res.status(200).send(filledHtml);
}
