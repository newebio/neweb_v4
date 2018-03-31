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
const SeansController_1 = require("./SeansController");
class SeansesManager {
    constructor(config) {
        this.config = config;
        this.seanses = {};
    }
    createSeans(params) {
        const seansId = params.sessionId + Math.round(Math.random() * 100000).toString();
        const controller = new SeansController_1.default({
            seansId,
            app: this.config.app,
            sessionId: params.sessionId,
            request: params.request,
            sessionsManager: this.config.sessionsManager,
            controllersManager: this.config.controllersManager,
            pageCreator: this.config.pageCreator,
        });
        this.seanses[seansId] = {
            controller,
            sessionId: params.sessionId,
        };
        return controller;
    }
    connect(params) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.seanses[params.seansId]) {
                yield this.restoreSeans();
            }
            this.seanses[params.seansId].socket = params.socket;
        });
    }
    disconnect(socket) {
        const seansid = Object.keys(this.seanses).find((n) => this.seanses[n].socket === socket);
        if (seansid) {
            this.seanses[seansid].socket = undefined;
        }
    }
    restoreSeans() {
        // TODO
    }
}
exports.default = SeansesManager;
