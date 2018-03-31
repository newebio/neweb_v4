import url = require("url");
import { IRequest, IRoute, IRoutePage, IRouter, ISessionContext } from "./..";
export interface IJsonableRoutePage {
    root: IJsonableRoutePageFrame;
}
export interface IJsonableRoutePageFrame {
    name: string;
    params: any;
    frames: { [index: string]: IJsonableRoutePageFrame };
}
class JsonableRouter implements IRouter {
    public async resolve({ request }: { request: IRequest, session: ISessionContext }): Promise<IRoute> {
        const u = url.parse(request.url);
        try {
            const jsonablePage: IJsonableRoutePage = JSON.parse(u.query || "");
            const page: IRoutePage = {
                url: request.url,
                rootFrame: jsonablePage.root,
            };
            return {
                type: "page",
                page,
            };
        } catch (e) {
            return {
                type: "notFound",
                text: "Invalid json",
            };
        }
    }
}
export default JsonableRouter;
