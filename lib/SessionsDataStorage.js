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
class SessionsDataStorage {
    constructor(config) {
        this.config = config;
    }
    getItem(sessionId, name) {
        return __awaiter(this, void 0, void 0, function* () {
            const session = yield this.config.sessionsStorage.get(sessionId);
            if (session && session.data && typeof (session.data[name]) !== "undefined") {
                return session.data[name];
            }
            return null;
        });
    }
    setItem(sessionId, name, value) {
        return __awaiter(this, void 0, void 0, function* () {
            const session = yield this.config.sessionsStorage.get(sessionId);
            if (!session) {
                return;
            }
            session.data = session.data || {};
            session.data[name] = value;
            yield this.config.sessionsStorage.set(sessionId, session);
        });
    }
}
exports.default = SessionsDataStorage;
