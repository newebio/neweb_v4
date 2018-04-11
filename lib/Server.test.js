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
const common_1 = require("./../common");
const Application_1 = require("./Application");
const Server_1 = require("./Server");
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
