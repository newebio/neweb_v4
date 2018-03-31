import { IPage, ISeanceDumpInfo } from "..";
import {
    IRemoteFrameControllerDataParams,
    IRemoteFrameControllerDispatchParams, IRemoteNewPageParams,
} from "../common";
import ClientApp from "./ClientApp";
import ClientPageRenderer from "./ClientPageRenderer";
export interface IClientSeanceConfig {
    seanceId: string;
    socket: SocketIOClient.Socket;
}
export interface IClientSeanceConfig {
    app: ClientApp;
    pageRenderer: ClientPageRenderer;
}
class ClientSeance {
    constructor(protected config: IClientSeanceConfig) { }
    public async initialize(initialInfo: ISeanceDumpInfo) {
        this.config.pageRenderer.setMethods({
            dispatch: (params: IRemoteFrameControllerDispatchParams) => this.dispatch(params),
            navigate: (url: string) => this.navigate(url),
        });
        if (initialInfo.page) {
            await this.loadPage(initialInfo.page);
            await this.config.pageRenderer.loadPage(initialInfo.page);
            await this.config.pageRenderer.initialize();
        }
        this.config.socket.on("frame-controller-data", (params: IRemoteFrameControllerDataParams) => {
            this.config.pageRenderer.emitFrameControllerData(params);
        });
        this.config.socket.on("new-page", async (params: IRemoteNewPageParams) => {
            await this.config.pageRenderer.newPage(params.page);
            history.replaceState(params.page, "", params.page.url);
        });
        await new Promise((resolve) => {
            this.config.socket.emit("initialize", { seanceId: this.config.seanceId }, resolve);
        });
    }
    public navigate(url: string) {
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
