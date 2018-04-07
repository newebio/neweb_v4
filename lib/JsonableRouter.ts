import o, { Onemitter } from "onemitter";
import url = require("url");
import { IRequest, IRoute, IRoutePage, IRouter } from "./..";
export interface IJsonableRoutePage {
    root: IJsonableRoutePageFrame;
}
export interface IJsonableRoutePageFrame {
    name: string;
    params: any;
    frames: { [index: string]: IJsonableRoutePageFrame };
}
class JsonableRouter implements IRouter {
    protected routeEmitter: Onemitter<IRoute> = o();
    public async navigate({ request }: { request: IRequest }) {
        const u = url.parse(request.url);
        try {
            const jsonablePage: IJsonableRoutePage = JSON.parse(u.query || "");
            const page: IRoutePage = {
                url: request.url,
                rootFrame: jsonablePage.root,
            };
            this.routeEmitter.emit({
                type: "page",
                page,
            });
        } catch (e) {
            this.routeEmitter.emit({
                type: "notFound",
                text: "Invalid json",
            });
        }
    }
    public onNewRoute(cb: any) {
        this.routeEmitter.addListener(cb);
    }
    public waitRoute() {
        return this.routeEmitter.wait();
    }
    public dispose() {
        this.routeEmitter.removeAllListeners();
    }
}
export default JsonableRouter;
