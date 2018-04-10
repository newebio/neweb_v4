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
const SeanceController_1 = require("./SeanceController");
class SeancesManager {
    constructor(config) {
        this.config = config;
    }
    connect(params) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!(yield this.config.store.has("seance", params.seanceId))) {
                yield this.restoreSeance();
            }
            yield this.config.store.set("seance-socket", params.seanceId, params.socketId);
            const controller = new SeanceController_1.default({ app: this.config.app, store: this.config.store });
            yield controller.connect(params.socketId);
        });
    }
    disconnect(socketId) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.config.store.removeObject("socket", socketId);
        });
    }
    restoreSeance() {
        // TODO: get info about seans from client
    }
}
exports.default = SeancesManager;
