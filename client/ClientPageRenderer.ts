import o, { Onemitter } from "onemitter";
import React = require("react");
import ReactDOM = require("react-dom");
import { IRemoteFrameControllerDataParams, IRemoteFrameControllerDispatchParams } from "../common";
import { IPage, IPageFrame } from "./../typings";
import ClientApp from "./ClientApp";
import NavigateContext from "./NavigateContext";
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
    protected seansStatusEmitter: Onemitter<string>;
    protected networkStatusEmitter: Onemitter<string>;
    protected rootElement: any;
    protected rootChildrenEmitter = o<React.ComponentClass<any>>();
    protected frames: {
        [index: string]: IClientPageFrame;
    } = {};
    protected currentPage: IPage;
    protected historyContext: any;
    constructor(protected config: IClientPageRendererConfig) {

    }
    public async loadPage(page: IPage) {
        await Promise.all(page.frames.map((f) => this.createFrame(f)));
        this.renderFrame(page.rootFrame);
        this.currentPage = page;
    }
    public async newPage(page: IPage) {
        await Promise.all(page.frames.map(async (frame) => {
            if (!this.frames[frame.frameId]) {
                await this.createFrame(frame);
            } else {
                this.updateFrame(frame);
            }
        }));
        // TODO delete old frames
        this.renderFrame(page.rootFrame);
        this.rootChildrenEmitter.emit(this.frames[page.rootFrame].element);
        this.currentPage = page;
    }
    public setMethods(params: {
        navigate: (url: string) => void;
        dispatch: (params: IRemoteFrameControllerDispatchParams) => Promise<void>;
        seansStatusEmitter: Onemitter<any>;
        networkStatusEmitter: Onemitter<any>;
        historyContext: any;
    }) {
        this.navigate = params.navigate;
        this.dispatch = params.dispatch;
        this.seansStatusEmitter = params.seansStatusEmitter;
        this.networkStatusEmitter = params.networkStatusEmitter;
        this.historyContext = params.historyContext;
    }
    public async initialize() {
        this.rootElement = React.createElement(RootComponent, {
            children: this.rootChildrenEmitter,
            seansStatusEmitter: this.seansStatusEmitter,
            networkStatusEmitter: this.networkStatusEmitter,
            historyContext: this.historyContext,
        });
        return new Promise((resolve) => {
            this.rootChildrenEmitter.emit(this.frames[this.currentPage.rootFrame].element);
            ReactDOM.hydrate(React.createElement(NavigateContext.Provider, {
                value: this.navigate,
                children: this.rootElement,
            }), this.config.rootHtmlElement, resolve);
        });
    }
    public emitFrameControllerData(params: IRemoteFrameControllerDataParams) {
        if (this.frames[params.frameId]) {
            this.frames[params.frameId].propsEmitter.emit({
                ...this.frames[params.frameId].propsEmitter.get(),
                data: params.data,
            });
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
        const oldProps = frame.propsEmitter.get();
        const newProps: any = {};
        Object.keys(oldProps).map((propName) => {
            if (propName === "data"
                || propName === "history"
                || propName === "params" || propName === "dispatch" || propName === "navigate") {
                newProps[propName] = oldProps[propName];
            } else if (places[propName]) {
                newProps[propName] = places[propName];
            } else {
                newProps[propName] = undefined;
            }
        });
        frame.propsEmitter.emit({ ...newProps, ...places });
    }
    protected async updateFrame(pageFrame: IPageFrame) {
        const oldFrame = this.frames[pageFrame.frameId];
        const props: any = {};
        if (JSON.stringify(oldFrame.frame.params) !== JSON.stringify(pageFrame.params)) {
            oldFrame.frame.params = pageFrame.params;
            props.params = pageFrame.params;
        }
        oldFrame.propsEmitter.emit({ ...oldFrame.propsEmitter.get(), ...props });
        oldFrame.frame.frames = pageFrame.frames;
    }
    protected async createFrame(pageFrame: IPageFrame) {
        const ViewClass = await this.config.app.getFrameViewClass(pageFrame);
        const data = pageFrame.data;
        const params = pageFrame.params;
        const props = {
            data,
            params,
            navigate: this.navigate,
            history: this.historyContext,
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
