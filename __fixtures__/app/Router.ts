import o from "onemitter";
import { IRequest, IRoute, IRouter, IRouterConfig } from "./../../typings";
class Router implements IRouter {
    public static instance: Router;
    public static clear() {
        if (Router.instance) {
            Router.instance.dispose.mockClear();
            Router.instance = null as any;
        }
    }
    public dispose = jest.fn().mockImplementation(() => {
        this.isDisposed = true;
    });
    public isDisposed = false;
    protected routeEmitter = o<IRoute>();
    constructor(public config: IRouterConfig) {
        Router.instance = this;
    }
    public async navigate(params: { request: IRequest }) {
        if (this.config.context.appContext1 !== "appContext1Value"
            || this.config.session.getItem("session1Item1").get() !== "session1Item1Value"
        ) {
            throw new Error("Invalid config");
        }
        if (params.request.url.indexOf("~counter~") > -1) {
            this.routeEmitter.emit({
                type: "page",
                page: {
                    url: params.request.url,
                    rootFrame: {
                        name: "counter",
                        params: {},
                        frames: {},
                    },
                },
            });
            return;
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
    }
    public waitRoute() {
        return this.routeEmitter.wait();
    }
    public onNewRoute(cb: any) {
        this.routeEmitter.addListener(cb);
    }
}
export default Router;
