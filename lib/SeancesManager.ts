import { IApplication, IRequest, NewebGlobalStore } from "../typings";
import SeanceController from "./SeanceController";
export interface ISeancesManagerConfig {
    app: IApplication;
    store: NewebGlobalStore;
}
class SeancesManager {
    constructor(protected config: ISeancesManagerConfig) { }

    public async connect(params: {
        seanceId: string;
        sessionId: string;
        socketId: string;
    }) {
        if (!await this.config.store.has("seance", params.seanceId)) {
            await this.restoreSeance();
        }
        await this.config.store.set("seance-socket", params.seanceId, params.socketId);
        const controller = new SeanceController({ app: this.config.app, store: this.config.store });
        await controller.connect(params.socketId);
    }
    public async disconnect(socketId: string) {
        await this.config.store.removeObject("socket", socketId);
    }
    protected restoreSeance() {
        // TODO: get info about seans from client
    }
}
export default SeancesManager;
