import { Socket } from "socket.io";
import { IApplication, IPage, IRequest, IRoutePage } from "../typings";
import ControllersManager from "./ControllersManager";
import PageCreator from "./PageCreator";
import SessionsManager from "./SessionsManager";

export interface ISeanceConfig {
    app: IApplication;
    sessionId: string;
    seanceId: string;
    request: IRequest;
    sessionsManager: SessionsManager;
    pageCreator: PageCreator;
    controllersManager: ControllersManager;
}
class SeanceController {
    protected userAgent: string;
    protected clientIpAddress: string;
    protected currentPage: IPage;
    protected socket?: Socket;
    constructor(protected config: ISeanceConfig) { }
    public connect(socket: Socket) {
        this.socket = socket;
        this.currentPage.frames.map((frame) => {
            socket.emit("frame-controller-data", {
                frameId: frame.frameId,
                data: this.config.controllersManager.getControllerData(frame.frameId),
            });
        });
    }
    public disconnect() {
        this.socket = undefined;
    }
    public async navigate(_: string) {

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
            seanceId: this.config.seanceId,
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
                seanceId: this.config.seanceId,
                sessionId: this.config.sessionId,
            });
            const data = await this.config.controllersManager.getControllerData(frame.frameId);
            frame.data = data;
            controller.on((value) => {
                if (this.socket) {
                    this.socket.emit("frame-controller-data", {
                        frameId: frame.frameId,
                        data: value,
                    });
                }
            });
        }));
        return page;
    }
}
export default SeanceController;
