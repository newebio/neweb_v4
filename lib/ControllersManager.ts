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
        };
    } = {};
    constructor(protected config: IControllersManagerConfig) { }
    public resolveController(params: ICreateControllerParams) {
        if (!this.controllers[params.frameId]) {
            this.createController(params);
        }
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
        this.controllers[params.frameId] = {
            controller,
            seanceId: params.seanceId,
            sessionId: params.sessionId,
        };
        return controller;
    }
}
export default ControllersManager;
