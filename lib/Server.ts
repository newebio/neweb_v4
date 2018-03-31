import { Response } from "express";
import { Socket } from "socket.io";
import { IApplication, IRequest } from "../typings";
import PageRenderer from "./PageRenderer";
import SeancesManager from "./SeancesManager";
import SessionsManager from "./SessionsManager";

export interface IServerConfig {
    sessionsManager: SessionsManager;
    seancesManager: SeancesManager;
    pageRenderer: PageRenderer;
    app: IApplication;
    logger: typeof console;
}
class Server {
    constructor(protected config: IServerConfig) { }
    public async onRequest(request: IRequest, res: Response) {
        const sessionId =
            await this.config.sessionsManager.resolveSessionIdByRequest(request);
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
        // Add session info to response
        await this.config.sessionsManager.enrichResponse(sessionId, res);
        const seance = await this.config.seancesManager.createSeance({ sessionId, request });
        await seance.loadPage(route.page);
        const seanceDump = seance.dumpToJson();
        const page = seanceDump.page;
        const { html } = await this.config.pageRenderer.render(seanceDump.page);
        res.status(200).send(await this.config.app.fillTemplate(html,
            { title: page.title, meta: page.meta }, seanceDump));
    }
    public async onNewConnection(socket: Socket) {
        socket.on("initialize", async (params: {
            seanceId: string;
        }) => {
            const sessionId = await this.config.sessionsManager.resolveSessionIdByRequest({
                clientIpAddress: socket.conn.remoteAddress,
                cookies: socket.request.cookies,
                headers: socket.request.headers,
                url: "",
                hostname: "",
            });
            await this.config.seancesManager.connect({
                seanceId: params.seanceId,
                sessionId,
                socket,
            });
        });
        socket.on("disconnect", () => this.disconnect(socket));
        socket.on("error", () => this.disconnect(socket));
    }
    protected async disconnect(socket: Socket) {
        await this.config.seancesManager.disconnect(socket);
    }
}
export default Server;
