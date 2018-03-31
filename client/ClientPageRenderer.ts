import o, { Onemitter } from "onemitter";
import React = require("react");
import ReactDOM = require("react-dom");
import { IRemoteFrameControllerDataParams, IRemoteFrameControllerDispatchParams } from "../common";
import { IPage, IPageFrame } from "./../typings";
import ClientApp from "./ClientApp";
import ReactOnemitter from "./ReactOnemitter";
import RootComponent from "./RootComponent";

export interface IClientPageRendererConfig {
    rootHtmlElement: HTMLElement | null;
    app: ClientApp;
}
export interface IClientPageFrame {
    element: any;
    propsEmitter: Onemitter<any>;
    frame: IPageFrame;
}
class ClientPageRenderer {
    protected navigate: (url: string) => void;
    protected dispatch: (params: IRemoteFrameControllerDispatchParams) => Promise<void>;
    protected rootElement: any;
    protected rootChildrenEmitter = o<React.ComponentClass<any>>();
    protected frames: {
        [index: string]: IClientPageFrame;
    } = {};
    protected currentPage: IPage;
    constructor(protected config: IClientPageRendererConfig) {
        this.rootElement = React.createElement(RootComponent, {
            children: this.rootChildrenEmitter,
        });
    }
    public async loadPage(page: IPage) {
        await Promise.all(page.frames.map((f) => this.createFrame(f)));
        this.renderFrame(page.rootFrame);
        this.currentPage = page;
    }
    public async initialize(params: {
        navigate: (url: string) => void;
        dispatch: (params: IRemoteFrameControllerDispatchParams) => Promise<void>;
    }) {
        this.navigate = params.navigate;
        this.dispatch = params.dispatch;
        return new Promise((resolve) => {
            this.rootChildrenEmitter.emit(this.frames[this.currentPage.rootFrame].element);
            ReactDOM.hydrate(this.rootElement, this.config.rootHtmlElement, resolve);
        });
    }
    public emitFrameControllerData(params: IRemoteFrameControllerDataParams) {
        if (this.frames[params.frameId]) {
            this.frames[params.frameId].propsEmitter.emit({ data: params.data });
        }
    }
    protected renderFrame(pageFrameId: string) {
        const frame = this.frames[pageFrameId];
        const places: any = {};
        Object.keys(frame.frame.frames).map((framePlace) => {
            const childFrameId = frame.frame.frames[framePlace];
            this.renderFrame(childFrameId);
            places[framePlace] = this.frames[childFrameId].element;
        });
        frame.propsEmitter.emit({ ...frame.propsEmitter.get(), places });
    }
    protected async createFrame(pageFrame: IPageFrame) {
        const ViewClass = await this.config.app.getFrameViewClass(pageFrame);
        const data = pageFrame.data;
        const params = pageFrame.params;
        const props = {
            data,
            params,
            navigate: this.navigate,
            dispatch: (actionName: string, ...args: any[]) => this.dispatch({
                frameId: pageFrame.frameId,
                actionName,
                args,
            }),
        };
        const propsEmitter = o<any>({ value: props });
        this.frames[pageFrame.frameId] = {
            propsEmitter,
            element: React.createElement(ReactOnemitter, {
                key: pageFrame.frameId,
                componentEmitter: o<React.ComponentClass<any>>({ value: ViewClass }),
                propsEmitter,
            }),
            frame: pageFrame,
        };
    }
}
export default ClientPageRenderer;
