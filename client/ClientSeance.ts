import { IPage, ISeanceDumpInfo } from "..";
import { IRemoteFrameControllerDataParams } from "../common";
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
        if (initialInfo.page) {
            await this.loadPage(initialInfo.page);
            await this.config.pageRenderer.loadPage(initialInfo.page);
            await this.config.pageRenderer.hydrate();
        }
        this.config.socket.on("frame-controller-data", (params: IRemoteFrameControllerDataParams) => {
            this.config.pageRenderer.emitFrameControllerData(params);
        });
        await new Promise((resolve) => {
            this.config.socket.emit("initialize", { seanceId: this.config.seanceId }, resolve);
        });
    }
    protected async loadPage(page: IPage) {
        await this.config.app.getPageClass(page);
    }
}
export default ClientSeance;
