import { Socket } from "socket.io";
import { IRemoteFrameControllerDispatchParams } from "../common";
import { IApplication, IPage, IPageFrame, IRequest, IRoutePage } from "../typings";
import ControllersManager from "./ControllersManager";
import PageComparator from "./PageComparator";
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
        socket.on("frame-controller-dispatch", async (params: IRemoteFrameControllerDispatchParams, cb) => {
            const controller = await this.config.controllersManager.getController(params.frameId);
            if (controller) {
                await controller.dispatch(params.actionName, ...params.args);
                cb();
            }
        });
        socket.on("navigate", async ({ url }: { url: string }) => {
            await this.navigate(url);
        });
    }
    public disconnect() {
        this.socket = undefined;
    }
    public async navigate(url: string) {
        const router = await this.config.app.getRouter();
        const route = await router.resolve({
            request: {
                ...this.config.request,
                url,
            },
            session: await this.config.sessionsManager.getSessionContext(this.config.sessionId),
        });
        if (route.type === "redirect") {
            if (this.socket) {
                this.socket.emit("redirect", route.url);
            }
            return;
        }
        if (route.type === "page") {
            await this.loadPage(route.page);
        }
        return route;
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
    protected async replacePage(routePage: IRoutePage) {
        const page = await this.config.pageCreator.createPage(routePage);
        const comparator = new PageComparator();
        const info = comparator.getCompareInfo(this.currentPage, page);
        // TODO not waiting
        info.frameidsForRemoving.map((frameId) => this.config.controllersManager.dispose(frameId));
        await Promise.all(info.newFrames.map(async (frame) => this.createController(frame)));
        await Promise.all(info.frameForChangeParams.map(async (frame) => {
            const controller = this.config.controllersManager.getController(frame.frameId);
            await controller.onChangeParams(frame.params);
        }));
        this.currentPage = info.page;

        if (this.socket) {
            this.socket.emit("new-page", {
                page: info.page,
            });
        }
    }
    protected async createPage(routePage: IRoutePage) {
        const page = await this.config.pageCreator.createPage(routePage);
        await Promise.all(page.frames.map(async (frame) => this.createController(frame)));
        return page;
    }
    protected async createController(frame: IPageFrame) {
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
    }
}
export default SeanceController;
