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
const onemitter_1 = require("onemitter");
class ClientSeance {
    constructor(config) {
        this.config = config;
        this.seansStatusEmitter = onemitter_1.default();
        this.networkStatusEmitter = onemitter_1.default();
    }
    initialize(initialInfo) {
        return __awaiter(this, void 0, void 0, function* () {
            this.seansId = initialInfo.seanceId;
            this.seansStatusEmitter.emit("initializing");
            this.networkStatusEmitter.emit(this.config.socket.connected ? "connected" : "disconnected");
            this.historyContext = {
                push: (url) => {
                    history.pushState(url, "", url);
                    this.navigate(url);
                },
                replace: (url) => {
                    history.replaceState(url, "", url);
                    this.navigate(url);
                },
            };
            this.config.pageRenderer.setMethods({
                dispatch: (params) => this.dispatch(params),
                navigate: (url) => this.navigate(url),
                seansStatusEmitter: this.seansStatusEmitter,
                networkStatusEmitter: this.networkStatusEmitter,
                historyContext: this.historyContext,
            });
            if (initialInfo.page) {
                yield this.loadPage(initialInfo.page);
                yield this.config.pageRenderer.loadPage(initialInfo.page);
                yield this.config.pageRenderer.initialize();
            }
            this.config.socket.on("connect", () => this.networkStatusEmitter.emit("connected"));
            this.config.socket.on("connect_error", () => this.networkStatusEmitter.emit("disconnected"));
            this.config.socket.on("connect_timeout", () => this.networkStatusEmitter.emit("disconnected"));
            this.config.socket.on("error", () => this.networkStatusEmitter.emit("disconnected"));
            this.config.socket.on("reconnect", () => this.networkStatusEmitter.emit("connected"));
            this.config.socket.on("reconnect_attempt", () => this.networkStatusEmitter.emit("connecting"));
            this.config.socket.on("reconnect_error", () => this.networkStatusEmitter.emit("disconnected"));
            this.config.socket.on("reconnect_failed", () => this.networkStatusEmitter.emit("disconnected"));
            this.config.socket.on("frame-controller-data", (params) => {
                this.config.pageRenderer.emitFrameControllerData(params);
            });
            this.config.socket.on("new-page", (params) => __awaiter(this, void 0, void 0, function* () {
                yield this.config.pageRenderer.newPage(params.page);
                history.replaceState(params.page.url, "", params.page.url);
                this.seansStatusEmitter.emit("ready");
            }));
            yield new Promise((resolve) => {
                this.config.socket.emit("initialize", { seanceId: this.config.seanceId }, resolve);
            });
            history.replaceState(window.location.href, "", window.location.href);
            window.onpopstate = (e) => {
                this.navigate(e.state);
            };
            this.seansStatusEmitter.emit("ready");
        });
    }
    navigate(url) {
        this.seansStatusEmitter.emit("navigating");
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
