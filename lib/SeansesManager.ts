import { Socket } from "socket.io";
import { IApplication, IRequest } from "../typings";
import ControllersManager from "./ControllersManager";
import PageCreator from "./PageCreator";
import SeansController from "./SeansController";
import SessionsManager from "./SessionsManager";
export interface ISeansesManagerConfig {
    app: IApplication;
    sessionsManager: SessionsManager;
    controllersManager: ControllersManager;
    pageCreator: PageCreator;
}
class SeansesManager {
    protected seanses: {
        [index: string]: {
            sessionId: string;
            controller: SeansController;
            socket?: Socket;
        };
    } = {};
    constructor(protected config: ISeansesManagerConfig) { }
    public createSeans(params: { request: IRequest; sessionId: string }) {
        const seansId = params.sessionId + Math.round(Math.random() * 100000).toString();
        const controller = new SeansController({
            seansId,
            app: this.config.app,
            sessionId: params.sessionId,
            request: params.request,
            sessionsManager: this.config.sessionsManager,
            controllersManager: this.config.controllersManager,
            pageCreator: this.config.pageCreator,
        });
        this.seanses[seansId] = {
            controller,
            sessionId: params.sessionId,
        };
        return controller;
    }
    public async connect(params: {
        seansId: string;
        sessionId: string;
        socket: Socket;
    }) {
        if (!this.seanses[params.seansId]) {
            await this.restoreSeans();
        }
        this.seanses[params.seansId].socket = params.socket;
    }
    public disconnect(socket: Socket) {
        const seansid = Object.keys(this.seanses).find((n) => this.seanses[n].socket === socket);
        if (seansid) {
            this.seanses[seansid].socket = undefined;
        }
    }
    protected restoreSeans() {
        // TODO
    }
}
export default SeansesManager;
