import o, { Onemitter } from "onemitter";
import { parse } from "url";
import {
    IApplication, IRequest, IRoute, IRoutePage,
    IRoutePageFrame, IRouter,
} from "./../typings";

export interface IFramesBasedRouter {
    app: IApplication;
}
class FramesBasedRouter implements IRouter {
    protected basePath = "/";
    protected routeEmitter: Onemitter<IRoute>;
    constructor(protected config: IFramesBasedRouter) {
        this.routeEmitter = o();
    }
    public async navigate({ request }: {
        request: IRequest;
    }) {
        try {
            const page = await this.resolvePage({ url: request.url });
            this.routeEmitter.emit({
                type: "page",
                page,
            });
        } catch (e) {
            this.routeEmitter.emit({
                type: "notFound",
                text: e.toString(),
            });
        }
    }
    public onNewRoute(cb: (route: IRoute) => void) {
        this.routeEmitter.addListener(cb);
    }
    public waitRoute() {
        return this.routeEmitter.wait();
    }
    public dispose() {
        this.routeEmitter.removeAllListeners();
    }
    protected async resolvePage({ url: rawUrl }: {
        url: string;
    }): Promise<IRoutePage> {
        const url = parse(rawUrl);
        if (!url.pathname) {
            throw new Error("Url should contain path: " + url);
        }
        const pathname = this.basePath ? url.pathname.substr(this.basePath.length) : url.pathname;
        const framesNames = pathname.split("_").map((frameName) => frameName || "index");
        const isExistings =
            (await Promise.all(framesNames.map((frameName) => this.config.app.hasFrame(frameName))));

        for (const [index, isExisting] of isExistings.entries()) {
            if (!isExisting) {
                throw new Error("Not found frame " + framesNames[index]);
            }
        }
        const params = url.query ? this.parseParams(url.query) : [];

        const page: IRoutePage = {
            url: rawUrl,
            rootFrame: this.getPageRouteFrame(framesNames, params),
        };
        return page;
    }
    protected getPageRouteFrame(framesNames: string[], params: any[], index = 0): IRoutePageFrame {
        return {
            name: framesNames[index],
            params: params[index],
            frames: framesNames[index + 1] ? {
                children: this.getPageRouteFrame(framesNames, params, index + 1),
            } : {},
        };
    }
    protected parseParams(query: string) {
        const queryParams = query.split("&");
        const params: Array<{ [index: string]: string }> = [];
        for (const param of queryParams) {
            const [paramFullName, paramValue] = param.split("=");
            const [frameShortName, paramName] = paramFullName.split("_");
            const frameNumber = parseInt(frameShortName.substr(1), 10);
            if (!params[frameNumber]) {
                params[frameNumber] = {};
            }
            params[frameNumber][paramName] = decodeURIComponent(paramValue);
        }
        return params;
    }
}
export default FramesBasedRouter;
