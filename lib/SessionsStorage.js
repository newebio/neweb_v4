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
const fs_1 = require("fs");
const mkdirp = require("mkdirp");
const path_1 = require("path");
const util_1 = require("util");
class SessionsStorage {
    constructor(config) {
        this.config = config;
    }
    get(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const sessionPath = this.getSessionPath(id);
            if (!(yield util_1.promisify(fs_1.exists)(sessionPath))) {
                return null;
            }
            try {
                const data = (yield util_1.promisify(fs_1.readFile)(sessionPath)).toString();
                return JSON.parse(data);
            }
            catch (e) {
                return null;
            }
        });
    }
    setData(sessionId, name, value) {
        return __awaiter(this, void 0, void 0, function* () {
            const session = yield this.get(sessionId);
            if (!session) {
                throw new Error("Not found session " + sessionId);
            }
            session.data[name] = value;
            yield this.set(sessionId, session);
        });
    }
    set(id, data) {
        return __awaiter(this, void 0, void 0, function* () {
            const sessionPath = this.getSessionPath(id);
            yield util_1.promisify(mkdirp)(path_1.dirname(sessionPath));
            yield util_1.promisify(fs_1.writeFile)(sessionPath, JSON.stringify(data));
        });
    }
    getSessionPath(id) {
        return path_1.resolve(path_1.join(this.config.sessionsPath, id, "sessions.json"));
    }
}
exports.default = SessionsStorage;
