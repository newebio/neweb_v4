import { IPackInfoModule } from "neweb-pack";

export interface IRequest {
    url: string;
    hostname: string;
    headers: { [index: string]: string | string[] | undefined };
    cookies: { [index: string]: string };
    clientIpAddress: string;
}

type IRoute = IPageRoute | IRedirectRoute | INotFoundRoute;

export interface IPageRoute {
    type: "page";
    page: IRoutePage;
}
export interface IRedirectRoute {
    type: "redirect";
    url: string;
}
export interface INotFoundRoute {
    type: "notFound";
    text: string;
}
export interface IRoutePage {
    page?: {
        name: string;
        params: any;
    };
    url: string;
    rootFrame: IRoutePageFrame;
}
export interface IRoutePageFrame {
    name: string;
    params: any;
    frames: {
        [index: string]: IRoutePageFrame;
    };
}
export interface IPageMetaInfo {
    title?: string;
    meta?: IPageMeta[];
}
export interface IPageMeta {
    name: string;
    content: string;
}
export interface IApplication {
    fillTemplate: (html: string, meta: IPageMetaInfo, initialInfo: any) => Promise<string>;
    getRouter: () => Promise<IRouter>;
    getContext: () => Promise<any>;
    getFrameControllerClass: (name: string) => Promise<IFrameControllerClass>;
    getFrameViewClass: (name: string) => Promise<React.ComponentClass<any>>;
    getFrameModules: (name: string) => Promise<IPackInfoModule[]>;
    hasFrame: (frameName: string) => Promise<boolean>;
}
export interface IFrameControllerConfig<P, D, C> {
    params: P;
    data: D;
    context: C;
    session: ISessionContext;
    navigate: (url: string) => void;
}
type IFrameControllerClass = new (config: IFrameControllerConfig<any, any, any>) => IFrameController;
export interface IRouter {
    resolve: (params: { request: IRequest; session: ISessionContext; }) => Promise<IRoute>;
}
export interface ISession {
    id: string;
    hash: string;
    sessid: string;
    data: any;
}
type FrameId = string;
export interface IPage {
    title?: string;
    meta?: IPageMeta[];
    rootFrame: FrameId;
    frames: IPageFrame[];
    modules: IPackInfoModule[];
}
export interface IPageFrame {
    frameId: FrameId;
    frameName: string;
    params: string;
    data: any;
    frames: {
        [index: string]: FrameId;
    };
}
export interface IFrameController {
    getInitialData: () => Promise<any>;
    dispatch: (name: string, ...args: any[]) => Promise<void>;
}
export interface ISessionContext {
    getItem(name: string): Promise<any>;
    setItem(name: string, value: any): Promise<void>;
}
export interface ISeanceDumpInfo {
    seanceId: string;
    page?: IPage;
}