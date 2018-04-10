"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const onemitter_1 = require("onemitter");
class Router {
    constructor(config) {
        this.config = config;
        this.dispose = jest.fn().mockImplementation(() => {
            this.isDisposed = true;
        });
        this.isDisposed = false;
        this.routeEmitter = onemitter_1.default();
        Router.instance = this;
    }
    static clear() {
        if (Router.instance) {
            Router.instance.dispose.mockClear();
            Router.instance = null;
        }
    }
    navigate(params) {
        if (this.config.context.appContext1 !== "appContext1Value"
            || this.config.session.getItem("session1Item1").get() !== "session1Item1Value") {
            throw new Error("Invalid config");
        }
        if (params.request.url.indexOf("~not-found~") > -1) {
            this.routeEmitter.emit({ type: "notFound", text: "NF1" });
            return;
        }
        if (params.request.url.indexOf("~redirect~") > -1) {
            this.routeEmitter.emit({ type: "redirect", url: "~new-url~" });
            return;
        }
        throw new Error("Unknown route");
    }
    waitRoute() {
        return this.routeEmitter.wait();
    }
    onNewRoute(cb) {
        this.routeEmitter.addListener(cb);
    }
}
exports.default = Router;
