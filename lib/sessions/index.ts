import { Response } from "express";
import uid = require("uid-safe");
import { IRequest, NewebGlobalStore } from "./../..";

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
    return (await createSession(store, request)).id;
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
    await store.set("session", id, { id, hash });
    return session;
}
export async function getSessionContext(store: NewebGlobalStore, sessionId: string) {
    /*await Promise.all(Object.keys(data).map(async (fieldName) => {
        await this.config.store.set("session-data", [id, fieldName], data[fieldName]);
    }));*/
    return {
        getItem: (name: string) => store.getEmitter("session-data", [sessionId, name]),
        setItem: async (name: string, value: string) => store.set("session-data", [sessionId, name], value),
    };
}
export async function enrichResponse(store: NewebGlobalStore, sessionId: string, response: Response) {
    const session = await store.get("session", sessionId);
    response.cookie("sessid", sessionId + ":" + session.hash);
}
