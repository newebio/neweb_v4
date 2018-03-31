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
class ClientSeance {
    constructor(config) {
        this.config = config;
    }
    initialize(initialInfo) {
        return __awaiter(this, void 0, void 0, function* () {
            this.config.pageRenderer.setMethods({
                dispatch: (params) => this.dispatch(params),
                navigate: (url) => this.navigate(url),
            });
            if (initialInfo.page) {
                yield this.loadPage(initialInfo.page);
                yield this.config.pageRenderer.loadPage(initialInfo.page);
                yield this.config.pageRenderer.initialize();
            }
            this.config.socket.on("frame-controller-data", (params) => {
                this.config.pageRenderer.emitFrameControllerData(params);
            });
            this.config.socket.on("new-page", (params) => __awaiter(this, void 0, void 0, function* () {
                yield this.config.pageRenderer.newPage(params.page);
                history.replaceState(params.page, "", params.page.url);
            }));
            yield new Promise((resolve) => {
                this.config.socket.emit("initialize", { seanceId: this.config.seanceId }, resolve);
            });
        });
    }
    navigate(url) {
        this.config.socket.emit("navigate", { url });
    }
    dispatch(params) {
        return __awaiter(this, void 0, void 0, function* () {
            yield new Promise((resolve) => {
                this.config.socket.emit("frame-controller-dispatch", params, resolve);
            });
        });
    }
    loadPage(page) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.config.app.getPageClass(page);
        });
    }
}
exports.default = ClientSeance;
