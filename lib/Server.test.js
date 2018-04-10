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
const Application_1 = require("./__mocks__/Application");
const SessionsManager_1 = require("./__mocks__/SessionsManager");
const Server_1 = require("./Server");
const ExpressResponse_1 = require("./testutil/ExpressResponse");
const Router_1 = require("./testutil/Router");
describe("Server::onRequest::tests", () => {
    const seancesManager = {};
    const sessionsManager = new SessionsManager_1.default();
    const pageRenderer = {};
    const logger = {};
    let app;
    let server;
    beforeEach(() => {
        app = new Application_1.default();
        server = new Server_1.default({
            sessionsManager: sessionsManager,
            seancesManager,
            pageRenderer,
            logger,
            app: app,
        });
    });
    const sid1 = "sid1";
    it("when request not found response should be with status - 404", () => __awaiter(this, void 0, void 0, function* () {
        const request = {
            url: "~not-found~",
            headers: {
                sid: sid1,
            },
            hostname: "", clientIpAddress: "", cookies: {},
        };
        const response = new ExpressResponse_1.default();
        yield server.onRequest(request, response);
        expect(response.getResponse()).toEqual({
            statusCode: 404,
            body: "NF1",
            headers: {},
        });
    }));
    it("when request need redirect, response should with status 302", () => __awaiter(this, void 0, void 0, function* () {
        const request = {
            hostname: "", clientIpAddress: "", cookies: {},
            url: "~redirect~",
            headers: {
                sid: sid1,
            },
        };
        const response = new ExpressResponse_1.default();
        yield server.onRequest(request, response);
        expect(response.getResponse()).toEqual({
            statusCode: 302,
            body: "",
            headers: {
                location: "~new-url~",
            },
        });
    }));
    afterEach(() => {
        expect(Router_1.default.instance.isDisposed);
        Router_1.default.clear();
    });
});
