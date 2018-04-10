import { IRequest } from "./../typings";
import Application from "./__mocks__/Application";
import SessionsManager from "./__mocks__/SessionsManager";
import Server from "./Server";
import ExpressResponse from "./testutil/ExpressResponse";
import Router from "./testutil/Router";

describe("Server::onRequest::tests", () => {
    const seancesManager = {} as any;
    const sessionsManager = new SessionsManager();
    const pageRenderer = {} as any;
    const logger = {} as any;
    let app: Application;
    let server: Server;
    beforeEach(() => {
        app = new Application();
        server = new Server({
            sessionsManager: sessionsManager as any,
            seancesManager,
            pageRenderer,
            logger,
            app: app as any,
        });
    });
    const sid1 = "sid1";
    it("when request not found response should be with status - 404", async () => {
        const request: IRequest = {
            url: "~not-found~",
            headers: {
                sid: sid1,
            },
            hostname: "", clientIpAddress: "", cookies: {},
        };
        const response = new ExpressResponse();
        await server.onRequest(request, response as any);
        expect(response.getResponse()).toEqual({
            statusCode: 404,
            body: "NF1",
            headers: {},
        });
    });
    it("when request need redirect, response should with status 302", async () => {
        const request: IRequest = {
            hostname: "", clientIpAddress: "", cookies: {},
            url: "~redirect~",
            headers: {
                sid: sid1,
            },
        };
        const response = new ExpressResponse();
        await server.onRequest(request, response as any);
        expect(response.getResponse()).toEqual({
            statusCode: 302,
            body: "",
            headers: {
                location: "~new-url~",
            },
        });
    });
    afterEach(() => {
        expect(Router.instance.isDisposed);
        Router.clear();
    });
});
