import { IApplication, IFrameController, ISessionContext } from "../typings";
export interface ICreateControllerParams {
    frameId: string;
    seanceId: string;
    sessionId: string;
    frameName: string;
    params: any;
    session: ISessionContext;
    context: any;
    navigate: (url: string) => void;
}
export interface IControllersManagerConfig {
    app: IApplication;
}
class ControllersManager {
    protected controllers: {
        [index: string]: {
            sessionId: string;
            seanceId: string;
            controller: IFrameController;
            dataCallback: (value: any) => void,
            data: any;
        };
    } = {};
    constructor(protected config: IControllersManagerConfig) { }
    public resolveController(params: ICreateControllerParams) {
        if (!this.controllers[params.frameId]) {
            this.createController(params);
        }
    }
    public getControllerData(frameId: string) {
        if (this.controllers[frameId]) {
            return this.controllers[frameId].data;
        }
    }
    public getController(frameId: string) {
        if (!this.controllers[frameId]) {
            throw new Error("Not found controller " + frameId);
        }
        return this.controllers[frameId].controller;
    }
    public async dispose(frameId: string) {
        await this.controllers[frameId].controller.dispose();
        this.controllers[frameId].controller.off(this.controllers[frameId].dataCallback);
        delete this.controllers[frameId];
    }
    public async createController(params: ICreateControllerParams) {
        const ControllerClass = await this.config.app.getFrameControllerClass(params.frameName);
        const controller = new ControllerClass({
            context: params.context,
            data: undefined,
            navigate: params.navigate,
            params: params.params,
            session: params.session,
        });
        const data = await controller.getInitialData();
        controller.emit(data);
        const dataCallback = (value: any) => {
            this.controllers[params.frameId].data = value;
        };
        this.controllers[params.frameId] = {
            controller,
            data,
            dataCallback,
            seanceId: params.seanceId,
            sessionId: params.sessionId,
        };
        controller.on(dataCallback);
        return controller;
    }
}
export default ControllersManager;
