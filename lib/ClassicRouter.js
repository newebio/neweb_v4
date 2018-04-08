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
const querystring = require("querystring");
const url_1 = require("url");
function MatchedRoute(opts, next) {
    return (request, context) => {
        const paths = opts.path.split("/");
        const regexpArr = [];
        const paramsNames = [];
        for (const pathO of paths) {
            if (pathO.indexOf(":") === 0) {
                regexpArr.push("([^\/]+)");
                paramsNames.push(pathO.substr(1));
            }
            else {
                regexpArr.push(pathO);
            }
        }
        const regexp = new RegExp("^" + regexpArr.join("\\\/") + "$", "");
        const url = url_1.parse(request.url);
        const pathname = url.pathname || "/";
        const match = pathname.match(regexp);
        if (!match) {
            return null;
        }
        match.shift();
        const params = {};
        paramsNames.map((paramName, i) => {
            params[paramName] = match[i];
        });
        context.params = Object.assign({}, params, (url.query ? querystring.parse(url.query) : {}));
        return !!match ? next(request, context) : null;
    };
}
exports.MatchedRoute = MatchedRoute;
function PageRouteWithParent(params, next) {
    return (request, context) => {
        const route = next(request, context);
        if (!route || route.type !== "page") {
            return route;
        }
        const childFrame = route.page.rootFrame;
        const parentParams = params.params ? params.params(request, context) : {};
        Object.keys(parentParams).map((paramName) => {
            delete context.params[paramName];
        });
        return {
            type: "page",
            page: Object.assign({}, route.page, { rootFrame: {
                    frames: {
                        children: childFrame,
                    },
                    name: params.parentFrame,
                    params: parentParams,
                } }),
        };
    };
}
exports.PageRouteWithParent = PageRouteWithParent;
function PageRouteByFrame(params) {
    return (request, context) => {
        return {
            type: "page",
            page: {
                rootFrame: {
                    name: params.frameName,
                    params: params.params ? params.params(request, context) : context.params,
                    frames: {},
                },
                url: request.url,
            },
        };
    };
}
exports.PageRouteByFrame = PageRouteByFrame;
function RouteWithRedirectOn(params) {
    return (request, context) => {
        if (params.condition(request, context)) {
            return {
                type: "redirect",
                url: params.url(request, context),
            };
        }
        return params.next(request, context);
    };
}
exports.RouteWithRedirectOn = RouteWithRedirectOn;
class ClassicRouter {
    constructor(config) {
        this.config = config;
        this.routes = [];
        this.routeEmitter = onemitter_1.default();
        this.currentRequest = this.config.request;
        this.onInit();
    }
    onInit() {
        //
    }
    addRoute(route) {
        this.routes.push(route);
    }
    navigate(params) {
        return __awaiter(this, void 0, void 0, function* () {
            this.currentRequest = params.request;
            for (const routeHandler of this.routes) {
                const route = routeHandler(params.request, {});
                if (route) {
                    this.emitRoute(route);
                    return;
                }
            }
            this.emitRoute({
                type: "notFound",
                text: "Unknown request " + params.request.url,
            });
        });
    }
    waitRoute() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.routeEmitter.wait();
        });
    }
    dispose() {
        return __awaiter(this, void 0, void 0, function* () {
            this.routeEmitter.removeAllListeners();
        });
    }
    onNewRoute(cb) {
        return __awaiter(this, void 0, void 0, function* () {
            this.routeEmitter.on(cb);
        });
    }
    emitRoute(route) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.routeEmitter.has() && JSON.stringify(this.routeEmitter.get()) === JSON.stringify(route)) {
                return;
            }
            this.routeEmitter.emit(route);
        });
    }
}
exports.default = ClassicRouter;
