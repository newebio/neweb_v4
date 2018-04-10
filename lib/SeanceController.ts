
import { IRemoteFrameControllerDispatchParams } from "../common";
import { IApplication, IPageFrame, IRequest, IRoute, IRoutePage, NewebGlobalStore } from "../typings";
import ControllersManager from "./ControllersManager";
import PageComparator from "./PageComparator";
import PageCreator from "./PageCreator";
import SessionsManager from "./SessionsManager";

export interface ISeanceConfig {
    app: IApplication;
    store: NewebGlobalStore;
}

class SeanceController {
    constructor(protected config: ISeanceConfig) {

    }

    public async connect(socketId: string) {
        const socket = await this.config.store.getObject("socket", socketId);
        const seanceId = await this.config.store.findId("seance-socket", (s) => s === socketId);
        const currentPage = await this.config.store.get("seance-current-page", seanceId);
        const controllersManager = new ControllersManager({
            app: this.config.app,
            store: this.config.store,
        });
        await Promise.all(currentPage.frames.map(async (frame) => {
            socket.emit("frame-controller-data", {
                frameId: frame.frameId,
                data: await controllersManager.getControllerData(frame.frameId),
            });
        }));
        socket.on("frame-controller-dispatch", async (params: IRemoteFrameControllerDispatchParams, cb) => {
            const controller = await controllersManager.getController(params.frameId);
            if (controller) {
                await controller.dispatch(params.actionName, ...params.args);
                cb();
            }
        });
        socket.on("navigate", async ({ url }: { url: string }) => {
            await this.navigate(seanceId, url);
        });
    }






}
export default SeanceController;
