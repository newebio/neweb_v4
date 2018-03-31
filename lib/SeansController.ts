import { IApplication, IPage, IRequest, IRoute, IRoutePage } from "../typings";
import ControllersManager from "./ControllersManager";
import PageCreator from "./PageCreator";
import SessionsManager from "./SessionsManager";

export interface ISeansConfig {
    app: IApplication;
    sessionId: string;
    seansId: string;
    request: IRequest;
    sessionsManager: SessionsManager;
    pageCreator: PageCreator;
    controllersManager: ControllersManager;
}
class SeansController {
    protected userAgent: string;
    protected clientIpAddress: string;
    protected currentPage: IPage;
    constructor(protected config: ISeansConfig) { }
    public async navigate(url: string) {

        /*const route = await router.resolve({
            request: {
                ...this.config.request,
                url,
            },
            session: await this.config.sessionsManager.getSessionContext(this.config.sessionId),
        });
        if (route.type === "page") {
            await this.loadPage(route.page);
        }
        return route;*/
    }
    public async loadPage(routePage: IRoutePage) {
        if (this.currentPage) {
            await this.replacePage(routePage);
        } else {
            this.currentPage = await this.createPage(routePage);
        }
    }
    public dumpToJson() {
        return {
            seansId: this.config.seansId,
            page: this.currentPage,
        };
    }
    protected async replacePage(_: IRoutePage) {
        // TODO
    }
    protected async createPage(routePage: IRoutePage) {
        const page = await this.config.pageCreator.createPage(routePage);
        await Promise.all(page.frames.map(async (frame) => {
            const controller = await this.config.controllersManager.createController({
                frameId: frame.frameId,
                session: await this.config.sessionsManager.getSessionContext(this.config.sessionId),
                context: await this.config.app.getContext(),
                frameName: frame.frameName,
                params: frame.params,
                navigate: (url) => this.navigate(url),
                seansId: this.config.seansId,
                sessionId: this.config.sessionId,
            });
            const data = await controller.getInitialData();
            frame.data = data;
        }));
        return page;
    }
}
export default SeansController;
