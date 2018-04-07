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
const url = require("url");
class JsonableRouter {
    constructor() {
        this.routeEmitter = onemitter_1.default();
    }
    navigate({ request }) {
        return __awaiter(this, void 0, void 0, function* () {
            const u = url.parse(request.url);
            try {
                const jsonablePage = JSON.parse(u.query || "");
                const page = {
                    url: request.url,
                    rootFrame: jsonablePage.root,
                };
                this.routeEmitter.emit({
                    type: "page",
                    page,
                });
            }
            catch (e) {
                this.routeEmitter.emit({
                    type: "notFound",
                    text: "Invalid json",
                });
            }
        });
    }
    onNewRoute(cb) {
        this.routeEmitter.addListener(cb);
    }
    waitRoute() {
        return this.routeEmitter.wait();
    }
    dispose() {
        this.routeEmitter.removeAllListeners();
    }
}
exports.default = JsonableRouter;
