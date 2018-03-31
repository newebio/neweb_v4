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
class ClientApp {
    constructor(config) {
        this.config = config;
    }
    getPageClass(routePage) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.loadModules(routePage.modules);
            return () => {
                //
            };
        });
    }
    loadModules(modules) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.config.modulesManager.preloadModules(modules);
        });
    }
    getFrameViewClass(pageFrame) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.config.modulesManager.preloadModules(pageFrame.modules);
            return (yield this.config.modulesManager.loadModule("local", "frames/" + pageFrame.frameName + "/view", pageFrame.frameVersion)).default;
        });
    }
}
exports.default = ClientApp;
