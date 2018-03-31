import { Response } from "express";
import { Socket } from "socket.io";
import { IApplication, IRequest } from "../typings";
import PageRenderer from "./PageRenderer";
import SeansesManager from "./SeansesManager";
import SessionsManager from "./SessionsManager";

export interface IServerConfig {
    sessionsManager: SessionsManager;
    seansesManager: SeansesManager;
    pageRenderer: PageRenderer;
    app: IApplication;
}
class Server {
    constructor(protected config: IServerConfig) { }
    public async onRequest(request: IRequest, res: Response) {
        const sessionId =
            await this.config.sessionsManager.resolveSessionIdByRequest(request);
        await this.config.sessionsManager.enrichResponse(sessionId, res);
        const router = await this.config.app.getRouter();
        const route =
            await router.resolve({ request, session: await this.config.sessionsManager.getSessionContext(sessionId) });
        if (route.type === "redirect") {
            res.header("location", route.url);
            res.sendStatus(302);
            return;
        }
        if (route.type === "notFound") {
            res.status(404).send(route.text);
            return;
        }
        const seans = await this.config.seansesManager.createSeans({ sessionId, request });
        await seans.loadPage(route.page);
        const seansDump = seans.dumpToJson();
        const page = seansDump.page;
        const { html } = await this.config.pageRenderer.render(seansDump.page);
        res.status(200).send(await this.config.app.fillTemplate(html,
            { title: page.title, meta: page.meta }, seansDump));
    }
    public async onNewConnection(socket: Socket) {
        socket.on("initialize", async (params: {
            seansId: string;
        }) => {
            const sessionId = await this.config.sessionsManager.resolveSessionIdByRequest({
                clientIpAddress: socket.conn.remoteAddress,
                cookies: socket.request.cookies,
                headers: socket.request.headers,
                url: "",
                hostname: "",
            });
            await this.config.seansesManager.connect({
                seansId: params.seansId,
                sessionId,
                socket,
            });
        });
        socket.on("disconnect", () => this.disconnect(socket));
        socket.on("error", () => this.disconnect(socket));
    }
    protected async disconnect(socket: Socket) {
        await this.config.seansesManager.disconnect(socket);
    }
}
export default Server;
