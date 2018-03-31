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
class ControllersManager {
    constructor(config) {
        this.config = config;
        this.controllers = {};
    }
    resolveController(params) {
        if (!this.controllers[params.frameId]) {
            this.createController(params);
        }
    }
    createController(params) {
        return __awaiter(this, void 0, void 0, function* () {
            const ControllerClass = yield this.config.app.getFrameControllerClass(params.frameName);
            const controller = new ControllerClass({
                context: params.context,
                data: undefined,
                navigate: params.navigate,
                params: params.params,
                session: params.session,
            });
            this.controllers[params.frameId] = {
                controller,
                seansId: params.seansId,
                sessionId: params.sessionId,
            };
            return controller;
        });
    }
}
exports.default = ControllersManager;
