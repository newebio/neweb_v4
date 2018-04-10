import { ModulePacker } from "neweb-pack";
import { resolve } from "path";
import Router from "./../__fixtures__/app/Router";
import { page1RootFrame as page1RootFrameModule } from "./../__mocks__/neweb-pack";
import { REQUIRE_FUNC_NAME } from "./../common";
import { IRequest, ISeanceDumpInfo, NewebGlobalStore } from "./../typings";
import Application from "./Application";
import Server from "./Server";
import ExpressResponse from "./testutil/ExpressResponse";
import Socket from "./testutil/Socket";
import createStore from "./testutil/store";
const session1Id = "session1IdValue";
const session1Hash = "session1HashValue";
const session1Sessid = session1Id + ":" + session1Hash;
const appPath = resolve(__dirname + "/../__fixtures__/app");
const modulePacker = new ModulePacker({
    appRoot: appPath,
    excludedModules: ["react", "react-dom", "neweb"],
    modulesPath: __dirname + "/../tmp",
    REQUIRE_FUNC_NAME,
});
describe("Server::onRequest::tests", () => {
    const logger = {} as any;
    let app: Application;
    let server: Server;
    let store: NewebGlobalStore;
    beforeEach(async () => {
        app = new Application({
            environment: "development",
            appPath,
            modulePacker: modulePacker as any,
        });
        store = createStore();
        await store.set("session", session1Id, { id: session1Id, hash: session1Hash });
        await store.set("session-data", [session1Id, "session1Item1"], "session1Item1Value");
        server = new Server({
            logger,
            app: app as any,
            store,
        });
    });
    afterEach(() => {
        expect(Router.instance.isDisposed);
    });
    it("when request not found response should be with status - 404", async () => {
        const request: IRequest = {
            url: "~not-found~",
            headers: {

            },
            hostname: "", clientIpAddress: "", cookies: {
                sessid: session1Sessid,
            },
        };
        const response = new ExpressResponse();
        await server.onRequest(request, response as any);
        expect(response.getResponse()).toEqual({
            statusCode: 404,
            body: "NF1",
            headers: {},
            cookies: {},
        });
    });
    it("when request need redirect, response should with status 302", async () => {
        const request: IRequest = {
            hostname: "", clientIpAddress: "", cookies: {
                sessid: session1Sessid,
            },
            url: "~redirect~",
            headers: {
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
            cookies: {},
        });
    });
    it("when request page, response should return html", async () => {
        const request: IRequest = {
            hostname: "", clientIpAddress: "", headers: {},
            cookies: {
                sessid: session1Sessid,
            },
            url: "~page1~",
        };
        const response = new ExpressResponse();
        await server.onRequest(request, response as any);
        const seansIds = Object.keys((await store.getAllData()).seance);
        const framesIds = Object.keys((await store.getAllData())["frame-controller"]);
        expect(seansIds.length).toBe(1);
        expect(framesIds.length).toBe(1);
        const seanceId = seansIds[0];
        const seanceInfo: ISeanceDumpInfo = {
            seanceId,
            page: {
                url: "~page1~",
                frames: [{
                    frameId: framesIds[0],
                    frameName: "page1RootFrame",
                    params: {},
                    frames: {},
                    data: undefined,
                    frameVersion: page1RootFrameModule.version,
                    modules: page1RootFrameModule.modules.concat({
                        name: page1RootFrameModule.name,
                        version: page1RootFrameModule.version,
                        type: page1RootFrameModule.type,
                    }),
                }],
                rootFrame: framesIds[0],
                modules: [],
            },
        };
        expect(response.getResponse()).toEqual({
            statusCode: 200,
            body: jasmine.any(String),
            headers: {},
            cookies: { sessid: session1Sessid },
        });
        const body = response.getResponse().body;
        const [title, meta, html, script] = body.split("|~|");
        expect(title).toBe("");
        expect(meta).toBe("<!--__page_meta_start__--><!--__page_meta_end__-->");
        expect(html).toBe("<div>page1RootFrameBody</div>");
        expect(script.substr(0, 20)).toBe(`window["__initial"]=`);
        expect(JSON.parse(script.substr(20))).toEqual(seanceInfo);
    });
});
describe("Server::onNewConnection::tests", () => {

    const logger = {} as any;
    let app: Application;
    let server: Server;
    let socket: Socket;
    let store: NewebGlobalStore;

    beforeEach(() => {
        app = new Application({
            environment: "development",
            appPath,
            modulePacker,
        });
        store = createStore();
        server = new Server({
            logger,
            app: app as any,
            store,
        });
        socket = new Socket();
    });
    afterEach(() => {
        //
    });
    it("when call onNewConnection, should subscribe to initialize, recovery and disconnect", async () => {
        await server.onNewConnection(socket as any);
        expect(socket.on.mock.calls.length).toBe(4);
        expect(socket.on.mock.calls).toContainEqual(["initialize", jasmine.any(Function)]);
        expect(socket.on.mock.calls).toContainEqual(["recovery", jasmine.any(Function)]);
        expect(socket.on.mock.calls).toContainEqual(["disconnect", jasmine.any(Function)]);
        expect(socket.on.mock.calls).toContainEqual(["error", jasmine.any(Function)]);
    });
    // tslint:disable-next-line:max-line-length
    it("when socket emit `error` or `disconnect` should removeAllListeners of socket and disconnect seans", async () => {
        socket.on.mockImplementation((eventName: string, callback: any) => {
            if (eventName === "error" || eventName === "disconnect") {
                callback();
            }
        });
        await server.onNewConnection(socket as any);
        expect(socket.removeAllListeners.mock.calls.length).toBe(2);
    });
    it("when socket emit `initialize` should connect seans", async () => {
        const cb = jest.fn();
        const params = {
            seanceId: "seans1",
        };
        let callbackPromise: any;
        socket.on.mockImplementation((eventName: string, callback: any) => {
            if (eventName === "initialize") {
                callbackPromise = callback(params, cb);
            }
        });
        await server.onNewConnection(socket as any);
        await callbackPromise;
        expect(cb.mock.calls.length).toBe(1);
    });
    it("when socket emit `recovery` should do nothing", async () => {
        await server.onNewConnection(socket as any);
    });

});
