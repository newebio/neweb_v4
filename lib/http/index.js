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
const seances_1 = require("./../seances");
const sessions_1 = require("./../sessions");
function httpRequest(store, requestId) {
    return __awaiter(this, void 0, void 0, function* () {
        const request = yield store.getObject("request", requestId);
        // get session's context
        const sessionId = yield sessions_1.resolveSessionIdByRequest(store, request);
        const sesionContext = yield sessions_1.getSessionContext(store, sessionId);
        const app = yield store.getObject("app", "default");
        // get current route
        const RouterClass = yield app.getRouterClass();
        const router = new RouterClass({
            context: yield app.getContext(),
            session: sesionContext,
            request,
        });
        router.navigate({ request });
        const route = yield router.waitRoute();
        router.dispose();
        // Handling route
        const res = yield store.getObject("http-response", requestId);
        // Handling route
        if (route.type === "redirect") {
            res.header("location", route.url);
            res.sendStatus(302);
            return;
        }
        if (route.type === "notFound") {
            res.status(404).send(route.text);
            return;
        }
        // create new seans with RoutePage
        const seanceId = yield seances_1.createSeance(store, { sessionId, request });
        yield seances_1.loadSeancePage(store, seanceId, route.page);
    });
}
exports.httpRequest = httpRequest;
