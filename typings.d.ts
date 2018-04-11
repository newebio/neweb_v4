import { IPackInfoModule, IPackInfo } from "neweb-pack";
import { Onemitter } from "onemitter";
import GlobalStore from "./lib/GlobalStore";
import { Socket } from "socket.io";
import { Request, Response } from "express";
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
    afterLoad?: (page: IPage) => void | Promise<void>,
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
export interface IRouterConfig {
    context: any;
    session: ISessionContext;
    request: IRequest;
}
export interface IRouterClass {
    new(config: IRouterConfig): IRouter;
}
export interface IApplication {
    fillTemplate: (html: string, meta: IPageMetaInfo, initialInfo: any) => Promise<string>;
    getRouterClass: () => Promise<IRouterClass>;
    getContext: () => Promise<any>;
    getFrameControllerClass: (name: string) => Promise<IFrameControllerClass>;
    getFrameViewClass: (name: string) => Promise<React.ComponentClass<any>>;
    getFrameViewModulePackInfo: (name: string) => Promise<IPackInfo>;
    hasFrame: (frameName: string) => Promise<boolean>;
}
export interface IFrameControllerConfig<P, D, C> {
    params: P;
    data?: D;
    context: C;
    session: ISessionContext;
    navigate: (url: string) => void;
}
type IFrameControllerClass = new (config: IFrameControllerConfig<any, any, any>) => IFrameController;
export interface IRouter {
    navigate: (params: { request: IRequest; }) => void | Promise<void>;
    waitRoute: () => Promise<IRoute>;
    onNewRoute: (cb: (route: IRoute) => any) => void | Promise<void>;
    dispose: () => void | Promise<void>;
}
export interface IRouterNavigateParams {
    request: IRequest;
}
export interface ISession {
    id: string;
    hash: string;
    sessid: string;
    data: any;
}
type FrameId = string;
export interface IPage {
    url: string;
    title?: string;
    meta?: IPageMeta[];
    rootFrame: FrameId;
    frames: IPageFrame[];
    modules: IPackInfoModule[];
}
export interface IPageFrame {
    frameId: FrameId;
    frameName: string;
    frameVersion?: string;
    modules: IPackInfoModule[];
    params: any;
    data: any;
    frames: {
        [index: string]: FrameId;
    };
}
export interface IFrameController extends Onemitter<any> {
    getInitialData: () => Promise<any>;
    dispatch: (name: string, ...args: any[]) => Promise<void>;
    dispose: () => Promise<void>;
    onChangeParams: (params: any) => Promise<void>;
}
export interface ISessionContext {
    getItem(name: string): Promise<Onemitter<any>>;
    setItem(name: string, value: any): Promise<void>;
}
export interface ISeanceDumpInfo {
    seanceId: string;
    page?: IPage;
}
export interface IViewProps<P, D> {
    params: P;
    data: D;
    history: IHistoryContext;
    navigate: (url: string) => void;
    dispatch: (actionName: string, ...args: any[]) => Promise<void>;
}
export interface IHistoryContext {
    push(url: string): void;
    replace(url: string): void;
}
export interface IRegistrySession {
    id: string;
    hash: string;
}
export interface IDataRegistry {
    session: IRegistrySession;
    "session-data": any;
    "frame-controller": {
        objectId: string;
        seanceId: string;
        sessionId: string;
    };
    "frame-controller-data": any;
    seance: {
        sessionId: string;
    };
    "seance-socket": string;
    "seance-current-page": IPage;
    "seance-request": IRequest;
    "request": IRequest;
}
export interface IObjectsRegistry {
    "app": IApplication;
    "frame-controller-object": IFrameController;
    "socket": Socket;
    "router": IRouter;
    "http-request": Request;
    "http-response": Response;
}
export interface IRegistryActions {
    "new-http-request": {
        args: {
            request: Request;
            response: Response;
        };
        params: {};
    };
    "new-controller-data": {
        params: { frameId: string };
        args: any; // data
    };
    "new-router-route": {
        params: {
            seanceId: string;
        };
        args: IRoute;
    };
    "new-socket-connection": {
        params: {};
        args: Socket;
    };
    "seance-navigate": {
        params: { seanceId: string };
        args: string; // url
    };
    [index: string]: { params: any, args: any };
}
export type NewebGlobalStore = GlobalStore<IDataRegistry, IObjectsRegistry, IRegistryActions>