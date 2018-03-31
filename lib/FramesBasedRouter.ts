import { parse } from "url";
import {
    IApplication, IRequest, IRoute, IRoutePage,
    IRoutePageFrame, IRouter, ISessionContext,
} from "./../typings";

export interface IFramesBasedRouter<C, CONFIG> {
    app: IApplication;
    context: C;
    config: CONFIG;
}
class FramesBasedRouter<C, CONFIG> implements IRouter {
    protected basePath = "/";
    constructor(protected config: IFramesBasedRouter<C, CONFIG>) {

    }
    public async resolve({ request, session }: {
        request: IRequest;
        session: ISessionContext;
    }): Promise<IRoute> {
        try {
            const page = await this.resolvePage({ url: request.url, session });
            return {
                type: "page",
                page,
            };
        } catch (e) {
            return {
                type: "notFound",
                text: e.toString(),
            };
        }
    }
    protected async resolvePage({ url: rawUrl }: {
        url: string;
        session: ISessionContext;
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
