import { Onemitter } from "onemitter";
import { IFrameControllerConfig } from "../typings";

export default class FrameController<PARAMS, DATA, CONTEXT> extends Onemitter<DATA> {
    constructor(protected config: IFrameControllerConfig<PARAMS, DATA, CONTEXT>) {
        super();
        this.onInit();
    }
    public getInitialData(): Promise<DATA> | DATA | undefined | Promise<undefined> {
        return this.config.data;
    }
    public onInit(): Promise<void> | void {
        //
    }
    public set(value: {[DATANAME in keyof DATA]?: DATA[DATANAME]}): void | Promise<void> {
        const currentValue = this.has() ? this.get() : undefined;
        const saved = typeof (value) === "object" ?
            (typeof (currentValue) === "object" ? { ...currentValue as any, ...value as any } : value) : value;
        super.emit(saved);
    }
    public dispatch(actionName: string, ...args: any[]): void | Promise<void> {
        if ((this as any)[actionName]) {
            return (this as any)[actionName](...args);
        }
        throw new Error("Unknown action " + actionName);
    }
    public dispose(): void | Promise<void> {
        this.removeAllListeners();
    }
    public onChangeParams(_: PARAMS): void | Promise<void> {
        //
    }
}
