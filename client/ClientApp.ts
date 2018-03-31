import { IPackInfoModule } from "neweb-pack";
import { IPage, IPageFrame } from "./../typings";
import ClientModulesManager from "./ClientModulesManager";

export interface IClientAppCpnfig {
    modulesManager: ClientModulesManager;
}
class ClientApp {
    constructor(protected config: IClientAppCpnfig) { }
    public async getPageClass(routePage: IPage) {
        await this.loadModules(routePage.modules);
        return () => {
            //
        };
    }
    public async loadModules(modules: IPackInfoModule[]) {
        await this.config.modulesManager.preloadModules(modules);
    }
    public async getFrameViewClass(pageFrame: IPageFrame) {
        await this.config.modulesManager.preloadModules(pageFrame.modules);
        return (await this.config.modulesManager.loadModule(
            "local", "frames/" + pageFrame.frameName + "/view", pageFrame.frameVersion)).default;
    }
}
export default ClientApp;
