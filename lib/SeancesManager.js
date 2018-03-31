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
        this.seances = {};
    }
    createSeance(params) {
        const seanceId = params.sessionId + Math.round(Math.random() * 100000).toString();
        const controller = new SeanceController_1.default({
            seanceId,
            app: this.config.app,
            sessionId: params.sessionId,
            request: params.request,
            sessionsManager: this.config.sessionsManager,
            controllersManager: this.config.controllersManager,
            pageCreator: this.config.pageCreator,
        });
        this.seances[seanceId] = {
            controller,
            sessionId: params.sessionId,
        };
        return controller;
    }
    connect(params) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.seances[params.seanceId]) {
                yield this.restoreSeance();
            }
            this.seances[params.seanceId].socket = params.socket;
        });
    }
    disconnect(socket) {
        const seanceId = Object.keys(this.seances).find((n) => this.seances[n].socket === socket);
        if (seanceId) {
            this.seances[seanceId].socket = undefined;
        }
    }
    restoreSeance() {
        // TODO
    }
}
exports.default = SeancesManager;
