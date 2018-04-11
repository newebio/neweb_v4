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
        const data = yield loadSessionFromStorage(store, id);
        if (!data || data.hash !== hash) {
            return (yield createSession(store, request)).id;
        }
        yield store.create("session", id, {
            type: "object",
            objectType: "app",
            id: "default",
        }, data);
        if (data.data) {
            yield Promise.all(Object.keys(data.data).map((fieldName) => __awaiter(this, void 0, void 0, function* () {
                yield store.create("session-data", [id, fieldName], {
                    type: "data",
                    dataType: "session",
                    id,
                }, data.data[fieldName]);
            })));
        }
        return id;
    });
}
exports.resolveSessionIdByRequest = resolveSessionIdByRequest;
function loadSessionFromStorage(store, id) {
    return __awaiter(this, void 0, void 0, function* () {
        const storage = yield store.getObject("sessions-storage", "default");
        const data = yield storage.get(id);
        if (!data) {
            return null;
        }
        return data;
    });
}
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
        const storage = yield store.getObject("sessions-storage", "default");
        yield storage.set(id, session);
        yield store.create("session", id, {
            type: "object",
            objectType: "app",
            id: "default",
        }, { id, hash });
        return session;
    });
}
function sessionSetData(store, params, args) {
    return __awaiter(this, void 0, void 0, function* () {
        yield store.set("session-data", [params.sessionId, args.name], args.value);
    });
}
exports.sessionSetData = sessionSetData;
function getSessionContext(store, parent, sessionId) {
    return __awaiter(this, void 0, void 0, function* () {
        return {
            getItem: (name) => store.getEmitter("session-data", [sessionId, name]),
            setItem: (name, value) => __awaiter(this, void 0, void 0, function* () {
                return store.dispatch("session-set-data", parent, {
                    sessionId,
                }, { name, value });
            }),
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
