import { Response } from "express";
import uid = require("uid-safe");
import { IDataRegistry, IObjectsRegistry, IRequest, NewebGlobalStore } from "./..";
import { IGlobalStoreParentItem } from "./GlobalStore";

export async function resolveSessionIdByRequest(store: NewebGlobalStore, request: IRequest) {
    let sessid = request.cookies.sessid;
    if (!sessid) {
        return (await createSession(store, request)).id;
    }
    if (Array.isArray(sessid)) {
        sessid = sessid[0];
    }
    const [id, hash] = sessid.split(":");
    if (await store.has("session", id)
        && (await store.get("session", id)).hash === hash) {
        return id;
    }
    const data = await loadSessionFromStorage(store, id);
    if (!data || data.hash !== hash) {
        return (await createSession(store, request)).id;
    }
    await store.create("session", id, {
        type: "object",
        objectType: "app",
        id: "default",
    }, data);
    if (data.data) {
        await Promise.all(Object.keys(data.data).map(async (fieldName) => {
            await store.create("session-data", [id, fieldName], {
                type: "data",
                dataType: "session",
                id,
            }, data.data[fieldName]);
        }));
    }
    return id;
}
async function loadSessionFromStorage(store: NewebGlobalStore, id: string) {
    const storage = await store.getObject("sessions-storage", "default");
    const data = await storage.get(id);
    if (!data) {
        return null;
    }
    return data;
}
async function createSession(store: NewebGlobalStore, _: IRequest) {
    const id = new Date().getTime().toString() + await uid(7);
    const hash = await uid(32);
    const sessid = id + ":" + hash;
    const session = {
        id,
        hash,
        sessid,
        data: {},
    };
    const storage = await store.getObject("sessions-storage", "default");
    await storage.set(id, session);
    await store.create("session", id, {
        type: "object",
        objectType: "app",
        id: "default",
    }, { id, hash });
    return session;
}
export async function sessionSetData(
    store: NewebGlobalStore,
    params: { sessionId: string },
    args: { name: string, value: any }) {
    await store.set("session-data", [params.sessionId, args.name], args.value);
    const storage = await store.getObject("sessions-storage", "default");
    storage.setData(params.sessionId, args.name, args.value);
}
export async function getSessionContext(
    store: NewebGlobalStore,
    parent: IGlobalStoreParentItem<IDataRegistry, IObjectsRegistry>,
    sessionId: string) {

    return {
        getItem: (name: string) => store.getEmitter("session-data", [sessionId, name]),
        setItem: async (name: string, value: string) => store.dispatch("session-set-data", parent, {
            sessionId,
        }, { name, value }),
    };
}
export async function enrichResponseForSession(store: NewebGlobalStore, sessionId: string, response: Response) {
    const session = await store.get("session", sessionId);
    response.cookie("sessid", sessionId + ":" + session.hash);
}
