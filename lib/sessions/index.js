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
const uid = require("uid-safe");
function resolveSessionIdByRequest(store, request) {
    return __awaiter(this, void 0, void 0, function* () {
        let sessid = request.cookies.sessid;
        if (!sessid) {
            return (yield createSession(store, request)).id;
        }
        if (Array.isArray(sessid)) {
            sessid = sessid[0];
        }
        const [id, hash] = sessid.split(":");
        if ((yield store.has("session", id))
            && (yield store.get("session", id)).hash === hash) {
            return id;
        }
        return (yield createSession(store, request)).id;
    });
}
exports.resolveSessionIdByRequest = resolveSessionIdByRequest;
function createSession(store, _) {
    return __awaiter(this, void 0, void 0, function* () {
        const id = new Date().getTime().toString() + (yield uid(7));
        const hash = yield uid(32);
        const sessid = id + ":" + hash;
        const session = {
            id,
            hash,
            sessid,
            data: {},
        };
        yield store.create("session", id, {
            type: "object",
            objectType: "app",
            id: "default",
        }, { id, hash });
        return session;
    });
}
function getSessionContext(store, sessionId) {
    return __awaiter(this, void 0, void 0, function* () {
        /*await Promise.all(Object.keys(data).map(async (fieldName) => {
            await this.config.store.set("session-data", [id, fieldName], data[fieldName]);
        }));*/
        return {
            getItem: (name) => store.getEmitter("session-data", [sessionId, name]),
            setItem: (name, value) => __awaiter(this, void 0, void 0, function* () { return store.set("session-data", [sessionId, name], value); }),
        };
    });
}
exports.getSessionContext = getSessionContext;
function enrichResponseForSession(store, sessionId, response) {
    return __awaiter(this, void 0, void 0, function* () {
        const session = yield store.get("session", sessionId);
        response.cookie("sessid", sessionId + ":" + session.hash);
    });
}
exports.enrichResponseForSession = enrichResponseForSession;
