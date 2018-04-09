import isAbsoluteUrl = require("is-absolute-url");
import { Socket } from "socket.io";
import { IRemoteFrameControllerDispatchParams } from "../common";
import { IApplication, IPage, IPageFrame, IRequest, IRoute, IRoutePage, IRouter } from "../typings";
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
    protected router: IRouter;
    constructor(protected config: ISeanceConfig) {

    }
    public async initialize() {
        const RouterClass = await this.config.app.getRouterClass();
        this.router = new RouterClass({
            app: this.config.app,
            session: await this.config.sessionsManager.getSessionContext(this.config.sessionId),
            context: await this.config.app.getContext(),
            request: this.config.request,
        });
        this.router.onNewRoute((route) => this.onNewRoute(route));
    }
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
        this.router.navigate({
            request: {
                ...this.config.request,
                url,
            },
        });
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
    protected async onNewRoute(route: IRoute) {
        if (route.type === "redirect") {
            const isAbsolute = isAbsoluteUrl(route.url);
            if (this.socket && isAbsolute) {
                this.socket.emit("redirect", route.url);
                return;
            }
            this.navigate(route.url);
            return;
        }
        if (route.type === "page") {
            await this.loadPage(route.page);
        }
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
        if (routePage.afterLoad) {
            await routePage.afterLoad(this.currentPage);
        }
        if (this.socket) {
            this.socket.emit("new-page", {
                page: info.page,
            });
        }
    }
    protected async createPage(routePage: IRoutePage) {
        const page = await this.config.pageCreator.createPage(routePage);
        await Promise.all(page.frames.map(async (frame) => this.createController(frame)));
        if (routePage.afterLoad) {
            await routePage.afterLoad(page);
        }
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
