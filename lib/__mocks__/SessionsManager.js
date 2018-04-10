"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const SessionContext_1 = require("../SessionContext");
class SessionsManager {
    constructor() {
        this.sessions = [{
                sid: "sid1",
                id: "sessid1",
                context: new SessionContext_1.default({
                    data: {
                        session1Item1: "session1Item1Value",
                    },
                    onSave: jest.fn(),
                }),
            }];
    }
    getById(id) {
        return this.sessions.find((s) => s.id === id);
    }
    getBySid(sid) {
        const session = this.sessions.find((s) => s.sid === sid);
        if (!session) {
            throw new Error("Unknown session by sid " + sid);
        }
        return session;
    }
    getSessionContext(id) {
        const session = this.sessions.find((s) => s.id === id);
        if (session) {
            return session.context;
        }
        throw new Error("Unknown session id");
    }
    resolveSessionIdByRequest(request) {
        const session = this.sessions.find((s) => s.sid === request.headers.sid);
        if (!session) {
            throw new Error("Unknown session");
        }
        return session.id;
    }
}
exports.default = SessionsManager;
