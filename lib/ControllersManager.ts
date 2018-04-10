import { IApplication, ISessionContext, NewebGlobalStore } from "../typings";

export interface IControllersManagerConfig {
    app: IApplication;
    store: NewebGlobalStore;
}
class ControllersManager {

    constructor(protected config: IControllersManagerConfig) { }
    
}
export default ControllersManager;
