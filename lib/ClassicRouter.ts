import o from "onemitter";
import querystring = require("querystring");
import { parse } from "url";
import { IPage, IPageRoute, IRequest, IRoute, IRouter, IRouterConfig, IRouterNavigateParams } from "./..";

export type IRouteHandler = (request: IRequest, context: any) => null | IRoute;
export type IRoutePageHandler = (request: IRequest, context: any) => IPageRoute;
export function MatchedRoute(opts: { path: string; }, next: IRouteHandler): IRouteHandler {
    return (request: IRequest, context) => {
        const paths = opts.path.split("/");
        const regexpArr: string[] = [];
        const paramsNames: string[] = [];
        for (const pathO of paths) {
            if (pathO.indexOf(":") === 0) {
                regexpArr.push("([^\/]+)");
                paramsNames.push(pathO.substr(1));
            } else {
                regexpArr.push(pathO);
            }
        }
        const regexp = new RegExp("^" + regexpArr.join("\\\/") + "$", "");
        const url = parse(request.url);
        const pathname = url.pathname || "/";
        const match = pathname.match(regexp);
        if (!match) {
            return null;
        }
        match.shift();
        const params: any = {};
        paramsNames.map((paramName, i) => {
            params[paramName] = match[i];
        });
        context.params = { ...params, ...(url.query ? querystring.parse(url.query) : {}) };
        return !!match ? next(request, context) : null;
    };
}
export function PageRouteWithParent(
    params: {
        parentFrame: string;
        params?: (request: IRequest, context: any) => any;
    },
    next: IRouteHandler): IRouteHandler {
    return (request: IRequest, context) => {
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
            page: {
                ...route.page,
                rootFrame: {
                    frames: {
                        children: childFrame,
                    },
                    name: params.parentFrame,
                    params: parentParams,
                },
            },
        };
    };
}
export function PageRouteWithAfterLoad(
    params: {
        afterLoad: (page: IPage) => void | Promise<void>;
    },
    handler: IRoutePageHandler): IRoutePageHandler {
    return (request: IRequest, context: any) => {
        const page = handler(request, context);
        page.page.afterLoad = params.afterLoad;
        return page;
    };
}
export function PageRouteByFrame(params: {
    frameName: string;
    params?: (request: IRequest, context: any) => any;
}): IRoutePageHandler {
    return (request: IRequest, context: any) => {
        const page: IPageRoute = {
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
        return page;
    };
}
export function RouteWithRedirectOn(
    params: {
        condition: (request: IRequest, context: any) => boolean;
        url: (request: IRequest, context: any) => string;
    },
    next: IRouteHandler): IRouteHandler {
    return (request: IRequest, context: any) => {
        if (params.condition(request, context)) {
            return {
                type: "redirect",
                url: params.url(request, context),
            };
        }
        return next(request, context);
    };
}
class ClassicRouter implements IRouter {
    protected routes: IRouteHandler[] = [];
    protected routeEmitter = o<IRoute>();
    protected currentRequest: IRequest;
    constructor(protected config: IRouterConfig) {
        this.currentRequest = this.config.request;
        this.onInit();
    }
    public onInit() {
        //
    }
    public addRoute(route: IRouteHandler) {
        this.routes.push(route);
    }
    public async navigate(params: IRouterNavigateParams) {
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
    }
    public async waitRoute() {
        return this.routeEmitter.wait();
    }
    public async dispose() {
        this.routeEmitter.removeAllListeners();
    }
    public async onNewRoute(cb: any) {
        this.routeEmitter.on(cb);
    }
    protected async emitRoute(route: IRoute) {
        if (this.routeEmitter.has() && JSON.stringify(this.routeEmitter.get()) === JSON.stringify(route)) {
            return;
        }
        this.routeEmitter.emit(route);
    }
}
export default ClassicRouter;
