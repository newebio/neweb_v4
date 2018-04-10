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
const neweb_pack_1 = require("neweb-pack");
const path_1 = require("path");
const Router_1 = require("./../__fixtures__/app/Router");
const neweb_pack_2 = require("./../__mocks__/neweb-pack");
const common_1 = require("./../common");
const Application_1 = require("./Application");
const Server_1 = require("./Server");
const ExpressResponse_1 = require("./testutil/ExpressResponse");
const Socket_1 = require("./testutil/Socket");
const store_1 = require("./testutil/store");
const session1Id = "session1IdValue";
const session1Hash = "session1HashValue";
const session1Sessid = session1Id + ":" + session1Hash;
const appPath = path_1.resolve(__dirname + "/../__fixtures__/app");
const modulePacker = new neweb_pack_1.ModulePacker({
    appRoot: appPath,
    excludedModules: ["react", "react-dom", "neweb"],
    modulesPath: __dirname + "/../tmp",
    REQUIRE_FUNC_NAME: common_1.REQUIRE_FUNC_NAME,
});
describe("Server::onRequest::tests", () => {
    const logger = {};
    let app;
    let server;
    let store;
    beforeEach(() => __awaiter(this, void 0, void 0, function* () {
        app = new Application_1.default({
            environment: "development",
            appPath,
            modulePacker: modulePacker,
        });
        store = store_1.default();
        yield store.set("session", session1Id, { id: session1Id, hash: session1Hash });
        yield store.set("session-data", [session1Id, "session1Item1"], "session1Item1Value");
        server = new Server_1.default({
            logger,
            app: app,
            store,
        });
    }));
    afterEach(() => {
        expect(Router_1.default.instance.isDisposed);
    });
    it("when request not found response should be with status - 404", () => __awaiter(this, void 0, void 0, function* () {
        const request = {
            url: "~not-found~",
            headers: {},
            hostname: "", clientIpAddress: "", cookies: {
                sessid: session1Sessid,
            },
        };
        const response = new ExpressResponse_1.default();
        yield server.onRequest(request, response);
        expect(response.getResponse()).toEqual({
            statusCode: 404,
            body: "NF1",
            headers: {},
            cookies: {},
        });
    }));
    it("when request need redirect, response should with status 302", () => __awaiter(this, void 0, void 0, function* () {
        const request = {
            hostname: "", clientIpAddress: "", cookies: {
                sessid: session1Sessid,
            },
            url: "~redirect~",
            headers: {},
        };
        const response = new ExpressResponse_1.default();
        yield server.onRequest(request, response);
        expect(response.getResponse()).toEqual({
            statusCode: 302,
            body: "",
            headers: {
                location: "~new-url~",
            },
            cookies: {},
        });
    }));
    it("when request page, response should return html", () => __awaiter(this, void 0, void 0, function* () {
        const request = {
            hostname: "", clientIpAddress: "", headers: {},
            cookies: {
                sessid: session1Sessid,
            },
            url: "~page1~",
        };
        const response = new ExpressResponse_1.default();
        yield server.onRequest(request, response);
        const seansIds = Object.keys((yield store.getAllData()).seance);
        const framesIds = Object.keys((yield store.getAllData())["frame-controller"]);
        expect(seansIds.length).toBe(1);
        expect(framesIds.length).toBe(1);
        const seanceId = seansIds[0];
        const seanceInfo = {
            seanceId,
            page: {
                url: "~page1~",
                frames: [{
                        frameId: framesIds[0],
                        frameName: "page1RootFrame",
                        params: {},
                        frames: {},
                        data: undefined,
                        frameVersion: neweb_pack_2.page1RootFrame.version,
                        modules: neweb_pack_2.page1RootFrame.modules.concat({
                            name: neweb_pack_2.page1RootFrame.name,
                            version: neweb_pack_2.page1RootFrame.version,
                            type: neweb_pack_2.page1RootFrame.type,
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
    }));
});
describe("Server::onNewConnection::tests", () => {
    const logger = {};
    let app;
    let server;
    let socket;
    let store;
    beforeEach(() => {
        app = new Application_1.default({
            environment: "development",
            appPath,
            modulePacker,
        });
        store = store_1.default();
        server = new Server_1.default({
            logger,
            app: app,
            store,
        });
        socket = new Socket_1.default();
    });
    afterEach(() => {
        //
    });
    it("when call onNewConnection, should subscribe to initialize, recovery and disconnect", () => __awaiter(this, void 0, void 0, function* () {
        yield server.onNewConnection(socket);
        expect(socket.on.mock.calls.length).toBe(4);
        expect(socket.on.mock.calls).toContainEqual(["initialize", jasmine.any(Function)]);
        expect(socket.on.mock.calls).toContainEqual(["recovery", jasmine.any(Function)]);
        expect(socket.on.mock.calls).toContainEqual(["disconnect", jasmine.any(Function)]);
        expect(socket.on.mock.calls).toContainEqual(["error", jasmine.any(Function)]);
    }));
    // tslint:disable-next-line:max-line-length
    it("when socket emit `error` or `disconnect` should removeAllListeners of socket and disconnect seans", () => __awaiter(this, void 0, void 0, function* () {
        socket.on.mockImplementation((eventName, callback) => {
            if (eventName === "error" || eventName === "disconnect") {
                callback();
            }
        });
        yield server.onNewConnection(socket);
        expect(socket.removeAllListeners.mock.calls.length).toBe(2);
    }));
    it("when socket emit `initialize` should connect seans", () => __awaiter(this, void 0, void 0, function* () {
        const cb = jest.fn();
        const params = {
            seanceId: "seans1",
        };
        let callbackPromise;
        socket.on.mockImplementation((eventName, callback) => {
            if (eventName === "initialize") {
                callbackPromise = callback(params, cb);
            }
        });
        yield server.onNewConnection(socket);
        yield callbackPromise;
        expect(cb.mock.calls.length).toBe(1);
    }));
    it("when socket emit `recovery` should do nothing", () => __awaiter(this, void 0, void 0, function* () {
        yield server.onNewConnection(socket);
    }));
});
