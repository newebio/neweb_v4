import { Socket } from "socket.io";
import { IApplication, IRequest } from "../typings";
import ControllersManager from "./ControllersManager";
import PageCreator from "./PageCreator";
import SeanceController from "./SeanceController";
import SessionsManager from "./SessionsManager";
export interface ISeancesManagerConfig {
    app: IApplication;
    sessionsManager: SessionsManager;
    controllersManager: ControllersManager;
    pageCreator: PageCreator;
}
class SeancesManager {
    protected seances: {
        [index: string]: {
            sessionId: string;
            controller: SeanceController;
            socket?: Socket;
        };
    } = {};
    constructor(protected config: ISeancesManagerConfig) { }
    public createSeance(params: { request: IRequest; sessionId: string }) {
        const seanceId = params.sessionId + Math.round(Math.random() * 100000).toString();
        const controller = new SeanceController({
            seanceId,
            app: this.config.app,
            sessionId: params.sessionId,
            request: params.request,
            sessionsManager: this.config.sessionsManager,
            controllersManager: this.config.controllersManager,
            pageCreator: this.config.pageCreator,
        });
        this.seances[seanceId] = {
            controller,
            sessionId: params.sessionId,
        };
        return controller;
    }
    public async connect(params: {
        seanceId: string;
        sessionId: string;
        socket: Socket;
    }) {
        if (!this.seances[params.seanceId]) {
            await this.restoreSeance();
        }
        this.seances[params.seanceId].socket = params.socket;
    }
    public disconnect(socket: Socket) {
        const seanceId = Object.keys(this.seances).find((n) => this.seances[n].socket === socket);
        if (seanceId) {
            this.seances[seanceId].socket = undefined;
        }
    }
    protected restoreSeance() {
        // TODO
    }
}
export default SeancesManager;
