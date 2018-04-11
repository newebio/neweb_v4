import { Socket } from "socket.io";
import { ISeanceDumpInfo, NewebGlobalStore } from "./..";
import { IGlobalStoreParentItem } from "./GlobalStore";
import { connectSeance, restoreSeance } from "./seances";
import { resolveSessionIdByRequest } from "./sessions";
import { parseRequestCookies } from "./util";
const defaultApp: IGlobalStoreParentItem<any, any> = {
    type: "object",
    objectType: "app",
    id: "default",
};
export async function recoverySocket(
    _: NewebGlobalStore, __: { socketId: string },
    ___: ISeanceDumpInfo) {
    // TODO
}
export async function onNewConnection(store: NewebGlobalStore, socket: Socket) {
    const socketId = generateSocketId();
    await store.setObject("socket", socketId, defaultApp, socket);
    // Ждем первое сообщение от клиента
    socket.on("initialize", (async (
        store2: NewebGlobalStore,
        socketId2: string, params: { seanceId: string }, cb: any) => {
        await store2.dispatch("socket-initialize", {
            type: "object",
            objectType: "socket",
            id: socketId2,
        }, { socketId: socketId2 }, params);
        cb();
    }).bind(undefined, store, socketId));
    // Либо сообщение о восстановлении сеанса
    socket.on("recovery", await store.action("socket-recovery", {
        type: "object",
        objectType: "socket",
        id: socketId,
    }, { socketId }));
    // При разрыве соединения или ошибке
    socket.on("disconnect", await store.action("socket-disconnect", {
        type: "object",
        objectType: "socket",
        id: socketId,
    }, { socketId }));
    socket.on("error", await store.action("socket-error", {
        type: "object",
        objectType: "socket",
        id: socketId,
    }, { socketId }));
}
function generateSocketId() {
    return (+new Date()) + Math.round(Math.random() * 100000).toString();
}
export async function disconnectSocket(store: NewebGlobalStore, socketId: string) {
    const socket = await store.getObject("socket", socketId);
    socket.removeAllListeners();
    await store.removeObject("socket", socketId);
}
export async function initializeSocket(
    store: NewebGlobalStore,
    socketId: string,
    params: { seanceId: string; }) {
    const socket = await store.getObject("socket", socketId);
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
    const sessionId = await resolveSessionIdByRequest(store, request);
    const seance = await store.getMaybe("seance", params.seanceId);
    if (!seance) {
        await restoreSeance();
    } else {
        if (seance.sessionId !== sessionId) {
            // TODO log
            return;
        }
        // connect seans to socket
        await connectSeance(store, { socketId, seanceId: params.seanceId, sessionId });
    }
}
