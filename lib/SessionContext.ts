import o, { Onemitter } from "onemitter";
import { ISessionContext } from "./..";

export interface ISessionContextConfig {
    data: any;
    onSave: (data: any) => Promise<void>;
}
class SessionContext implements ISessionContext {
    protected data: { [index: string]: Onemitter<any> } = {};
    constructor(protected config: ISessionContextConfig) {
        Object.keys(this.config.data).map((key) => {
            this.data[key] = o({ value: this.config.data[key] });
        });
    }
    public getItem(name: string) {
        if (!this.data[name]) {
            this.data[name] = o();
        }
        return this.data[name];
    }
    public async setItem(name: string, value: any) {
        if (!this.data[name]) {
            this.data[name] = o();
        }
        const data: any = {};
        Object.keys(this.data).map((key) => {
            if (this.data[key].has()) {
                data[key] = this.data[key].get();
            }
        });
        await this.config.onSave(data);
        this.data[name].emit(value);
    }
}
export default SessionContext;
