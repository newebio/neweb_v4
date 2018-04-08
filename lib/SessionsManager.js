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
const SessionContext_1 = require("./SessionContext");
class SessionsManager {
    constructor(config) {
        this.config = config;
        this.sessions = {};
    }
    getSessionContext(sessionId) {
        return __awaiter(this, void 0, void 0, function* () {
            const session = yield this.getSessionById(sessionId);
            if (!session) {
                throw new Error("Not found session " + sessionId);
            }
            return session.context;
        });
    }
    enrichResponse(sessionId, response) {
        return __awaiter(this, void 0, void 0, function* () {
            const session = this.sessions[sessionId];
            response.cookie("sessid", sessionId + ":" + session.hash);
        });
    }
    resolveSessionIdByRequest(request) {
        return __awaiter(this, void 0, void 0, function* () {
            let sessid = request.cookies.sessid;
            let sessionId;
            if (!sessid) {
                sessionId = (yield this.createSession(request)).id;
            }
            else {
                if (Array.isArray(sessid)) {
                    sessid = sessid[0];
                }
                const [id, hash] = sessid.split(":");
                sessionId = id;
                if (!this.sessions[id]) {
                    yield this.loadSession(id);
                }
                if (!this.sessions[id] || this.sessions[id].hash !== hash) {
                    sessionId = (yield this.createSession(request)).id;
                }
            }
            return this.sessions[sessionId].session.id;
        });
    }
    createSession(_) {
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
            this.sessions[id] = {
                session, hash, context: yield this.createSessionContext(id, {}),
            };
            yield this.config.sessionsStorage.set(id, session);
            return session;
        });
    }
    loadSession(sessionId) {
        return __awaiter(this, void 0, void 0, function* () {
            const sessionData = yield this.config.sessionsStorage.get(sessionId);
            if (!sessionData) {
                return;
            }
            const session = Object.assign({}, sessionData);
            this.sessions[sessionId] = {
                session, hash: sessionData.hash, context: yield this.createSessionContext(sessionId, session.data),
            };
        });
    }
    createSessionContext(id, data) {
        return __awaiter(this, void 0, void 0, function* () {
            const context = new SessionContext_1.default({
                data,
                onSave: (newData) => __awaiter(this, void 0, void 0, function* () {
                    this.sessions[id].session.data = newData;
                    yield this.config.sessionsStorage.set(id, this.sessions[id].session);
                }),
            });
            return context;
        });
    }
    getSessionById(sessionId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.sessions[sessionId]) {
                yield this.loadSession(sessionId);
            }
            if (!this.sessions[sessionId]) {
                return null;
            }
            return this.sessions[sessionId];
        });
    }
}
exports.default = SessionsManager;
