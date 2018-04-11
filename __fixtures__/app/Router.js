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
        return __awaiter(this, void 0, void 0, function* () {
            if (this.config.context.appContext1 !== "appContext1Value"
                || this.config.session.getItem("session1Item1").get() !== "session1Item1Value") {
                throw new Error("Invalid config");
            }
            if (params.request.url.indexOf("~page1~") > -1) {
                this.routeEmitter.emit({
                    type: "page",
                    page: {
                        url: params.request.url,
                        rootFrame: {
                            name: "page1RootFrame",
                            params: {},
                            frames: {},
                        },
                    },
                });
                return;
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
        });
    }
    waitRoute() {
        return this.routeEmitter.wait();
    }
    onNewRoute(cb) {
        this.routeEmitter.addListener(cb);
    }
}
exports.default = Router;
