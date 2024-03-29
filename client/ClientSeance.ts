import o from "onemitter";
import { IHistoryContext, IPage, ISeanceDumpInfo } from "./..";
import {
    IRemoteFrameControllerDataParams,
    IRemoteFrameControllerDispatchParams, IRemoteNewPageParams,
} from "./../common";
import ClientApp from "./ClientApp";
import ClientPageMetaManager from "./ClientPageMetaManager";
import ClientPageRenderer from "./ClientPageRenderer";
export interface IClientSeanceConfig {
    seanceId: string;
    socket: SocketIOClient.Socket;
}
export interface IClientSeanceConfig {
    app: ClientApp;
    pageRenderer: ClientPageRenderer;
    pageMetaManager: ClientPageMetaManager;
}
class ClientSeance {
    protected seansStatusEmitter = o();
    protected networkStatusEmitter = o<string>();
    protected seansId: string;
    protected historyContext: IHistoryContext;
    constructor(protected config: IClientSeanceConfig) { }
    public async initialize(initialInfo: ISeanceDumpInfo) {
        this.seansId = initialInfo.seanceId;
        this.seansStatusEmitter.emit("initializing");
        this.networkStatusEmitter.emit(this.config.socket.connected ? "connected" : "disconnected");
        this.historyContext = {
            push: (url: string) => {
                history.pushState(url, "", url);
                this.navigate(url);
            },
            replace: (url: string) => {
                history.replaceState(url, "", url);
                this.navigate(url);
            },
        };
        this.config.pageRenderer.setMethods({
            dispatch: (params: IRemoteFrameControllerDispatchParams) => this.dispatch(params),
            navigate: (url: string) => this.navigate(url),
            seansStatusEmitter: this.seansStatusEmitter,
            networkStatusEmitter: this.networkStatusEmitter,
            historyContext: this.historyContext,
        });
        if (initialInfo.page) {
            await this.loadPage(initialInfo.page);
            await this.config.pageRenderer.loadPage(initialInfo.page);
            await this.config.pageRenderer.initialize();
        }
        this.config.socket.on("connect", () => this.networkStatusEmitter.emit("connected"));
        this.config.socket.on("connect_error", () => this.networkStatusEmitter.emit("disconnected"));
        this.config.socket.on("connect_timeout", () => this.networkStatusEmitter.emit("disconnected"));
        this.config.socket.on("error", () => this.networkStatusEmitter.emit("disconnected"));
        this.config.socket.on("reconnect", () => this.networkStatusEmitter.emit("connected"));
        this.config.socket.on("reconnect_attempt", () => this.networkStatusEmitter.emit("connecting"));
        this.config.socket.on("reconnect_error", () => this.networkStatusEmitter.emit("disconnected"));
        this.config.socket.on("reconnect_failed", () => this.networkStatusEmitter.emit("disconnected"));
        this.config.socket.on("frame-controller-data", (params: IRemoteFrameControllerDataParams) => {
            this.config.pageRenderer.emitFrameControllerData(params);
        });
        this.config.socket.on("new-page", async (params: IRemoteNewPageParams) => {
            await this.config.pageRenderer.newPage(params.page);
            history.replaceState(params.page.url, params.page.title || "", params.page.url);
            this.config.pageMetaManager.update(params.page);
            this.seansStatusEmitter.emit("ready");
        });
        await new Promise((resolve) => {
            this.config.socket.emit("initialize", { seanceId: this.config.seanceId }, resolve);
        });
        history.replaceState(window.location.href, "", window.location.href);
        window.onpopstate = (e) => {
            this.navigate(e.state);
        };
        this.seansStatusEmitter.emit("ready");
    }
    public navigate(url: string) {
        this.seansStatusEmitter.emit("navigating");
        this.config.socket.emit("navigate", { url });
    }
    public async dispatch(params: IRemoteFrameControllerDispatchParams) {
        await new Promise((resolve) => {
            this.config.socket.emit("frame-controller-dispatch", params, resolve);
        });
    }
    protected async loadPage(page: IPage) {
        await this.config.app.getPageClass(page);
    }
}
export default ClientSeance;
