"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const cookieParser = require("cookie-parser");
class Server {
    constructor(config) {
        this.config = config;
    }
    onRequest(request, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const sessionId = yield this.config.sessionsManager.resolveSessionIdByRequest(request);
            const RouterClass = yield this.config.app.getRouterClass();
            const router = new RouterClass({
                app: this.config.app,
                context: this.config.app.getContext(),
                session: yield this.config.sessionsManager.getSessionContext(sessionId),
                request,
            });
            router.navigate({ request });
            const route = yield router.waitRoute();
            router.dispose();
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
            yield this.config.sessionsManager.enrichResponse(sessionId, res);
            const seance = yield this.config.seancesManager.createSeance({ sessionId, request });
            yield seance.loadPage(route.page);
            const seanceDump = seance.dumpToJson();
            const page = seanceDump.page;
            const { html } = yield this.config.pageRenderer.render(seanceDump.page);
            res.status(200).send(yield this.config.app.fillTemplate(html, { title: page.title, meta: page.meta }, seanceDump));
        });
    }
    onNewConnection(socket) {
        return __awaiter(this, void 0, void 0, function* () {
            yield new Promise((resolve) => {
                cookieParser()(socket.request, {}, resolve);
            });
            socket.on("initialize", (params, cb) => __awaiter(this, void 0, void 0, function* () {
                const sessionId = yield this.config.sessionsManager.resolveSessionIdByRequest({
                    clientIpAddress: socket.conn.remoteAddress,
                    cookies: socket.request.cookies,
                    headers: socket.request.headers,
                    url: "",
                    hostname: "",
                });
                yield this.config.seancesManager.connect({
                    seanceId: params.seanceId,
                    sessionId,
                    socket,
                });
                cb();
            }));
            socket.on("disconnect", () => this.disconnect(socket));
            socket.on("error", () => this.disconnect(socket));
        });
    }
    disconnect(socket) {
        return __awaiter(this, void 0, void 0, function* () {
            socket.removeAllListeners();
            yield this.config.seancesManager.disconnect(socket);
        });
    }
}
exports.default = Server;
