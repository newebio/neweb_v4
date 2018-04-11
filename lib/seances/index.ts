import isAbsoluteUrl = require("is-absolute-url");
import { IPageFrame, IRequest, IRoute, IRoutePage, NewebGlobalStore } from "./../..";
import { createController, disposeController, getController, getControllerData } from "./../controllers";
import PageComparator from "./../PageComparator";
import PageCreator from "./../PageCreator";
import { getSessionContext } from "./../sessions";

export async function navigateSeance(store: NewebGlobalStore, seanceId: string, url: string) {
    const router = await store.getObject("router", seanceId);
    const request = await store.get("seance-request", seanceId);
    router.navigate({
        request: {
            ...request,
            url,
        },
    });
}

export async function onNewRoute(store: NewebGlobalStore, seanceId: string, route: IRoute) {
    if (route.type === "redirect") {
        const isAbsolute = isAbsoluteUrl(route.url);
        const socketId = await store.get("seance-socket", seanceId);
        if (socketId && isAbsolute) {
            const socket = await store.getObject("socket", socketId);
            socket.emit("redirect", route.url);
            return;
        }
        store.dispatch("seance-navigate", { seanceId }, route.url);
        return;
    }
    if (route.type === "page") {
        await loadSeancePage(store, seanceId, route.page);
    }
}

export async function createSeance(store: NewebGlobalStore, params: { request: IRequest; sessionId: string }) {
    const seanceId = params.sessionId + Math.round(Math.random() * 100000).toString();
    await store.set("seance", seanceId, {
        sessionId: params.sessionId,
    });
    await initializeSeance(store, {
        seanceId,
        sessionId: params.sessionId,
        request: params.request,
    });
    return seanceId;
}
export async function initializeSeance(store: NewebGlobalStore, params: {
    seanceId: string;
    sessionId: string;
    request: IRequest;
}) {
    const app = await store.getObject("app", "default");
    const RouterClass = await app.getRouterClass();
    const router = new RouterClass({
        session: await getSessionContext(store, params.sessionId),
        context: await app.getContext(),
        request: params.request,
    });
    await store.set("seance-request", params.seanceId, params.request);
    await store.setObject("router", params.seanceId, router);
    router.onNewRoute(await store.action("new-router-route", {
        seanceId: params.seanceId,
    }));
}
export async function loadSeancePage(store: NewebGlobalStore, seanceId: string, routePage: IRoutePage) {
    if (await store.has("seance-current-page", seanceId)) {
        await replaceSeancePage(store, seanceId, routePage);
    } else {
        await store.set("seance-current-page", seanceId, await createSeancePage(store, seanceId, routePage));
    }
}
async function createSeancePage(store: NewebGlobalStore, seanceId: string, routePage: IRoutePage) {
    const pageCreator = new PageCreator({ app: await store.getObject("app", "default") });
    const page = await pageCreator.createPage(routePage);
    await Promise.all(page.frames.map(async (frame) => createFrameSeanceController(store, seanceId, frame)));
    if (routePage.afterLoad) {
        await routePage.afterLoad(page);
    }
    return page;
}
async function createFrameSeanceController(store: NewebGlobalStore, seanceId: string, frame: IPageFrame) {
    const seance = await store.get("seance", seanceId);
    const app = await store.getObject("app", "default");
    await createController(store, {
        frameId: frame.frameId,
        session: await getSessionContext(store, seance.sessionId),
        context: await app.getContext(),
        frameName: frame.frameName,
        params: frame.params,
        navigate: await store.action("seance-navigate", { seanceId }),
        seanceId,
        sessionId: seance.sessionId,
    });
    const data = await getControllerData(store, frame.frameId);
    frame.data = data;
}
async function replaceSeancePage(store: NewebGlobalStore, seanceId: string, routePage: IRoutePage) {
    const app = await store.getObject("app", "default");
    const pageCreator = new PageCreator({
        app,
    });
    const page = await pageCreator.createPage(routePage);
    const comparator = new PageComparator();
    const currentPage = await store.get("seance-current-page", seanceId);
    const info = comparator.getCompareInfo(currentPage, page);
    // TODO not waiting
    await Promise.all(info.frameidsForRemoving.map(async (frameId) => disposeController(store, frameId)));
    await Promise.all(info.newFrames.map(async (frame) => createFrameSeanceController(store, seanceId, frame)));
    await Promise.all(info.frameForChangeParams.map(async (frame) => {
        const controller = await getController(store, frame.frameId);
        await controller.onChangeParams(frame.params);
    }));
    await store.set("seance-current-page", seanceId, info.page);
    if (routePage.afterLoad) {
        await routePage.afterLoad(info.page);
    }
    const socketId = await store.get("seance-socket", seanceId);
    if (socketId) {
        if (await store.hasObject("socket", socketId)) {
            const socket = await store.getObject("socket", socketId);
            socket.emit("new-page", {
                page: info.page,
            });
        }
    }
}
