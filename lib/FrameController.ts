import { Onemitter } from "onemitter";
import { IFrameControllerConfig } from "../typings";

export default class FrameController<P, D, C> extends Onemitter<D> {
    constructor(protected config: IFrameControllerConfig<P, D, C>) {
        super();
        this.onInit();
    }
    public async getInitialData(): Promise<D> {
        return this.config.data;
    }
    public onInit() {
        //
    }
    public dispatch(actionName: string, ...args: any[]) {
        if ((this as any)[actionName]) {
            return (this as any)[actionName](...args);
        }
        throw new Error("Unknown action " + actionName);
    }
    public dispose() {
        this.removeAllListeners();
    }
    public async onChangeParams() {
        //
    }
}
