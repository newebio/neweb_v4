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
const path_1 = require("path");
const controller_1 = require("../__fixtures__/app/frames/counter/controller");
const ExpressResponse_1 = require("../lib/testutil/ExpressResponse");
const StoreHelper_1 = require("./../lib/testutil/StoreHelper");
const appPath = path_1.resolve(__dirname + "/../__fixtures__/app");
const appParentItem = {
    type: "object",
    objectType: "app",
    id: "default",
};
describe("sockets::tests", () => {
    let storeHelper;
    beforeEach(() => __awaiter(this, void 0, void 0, function* () {
        storeHelper = new StoreHelper_1.default({
            appPath,
        });
        yield storeHelper.initialize();
    }));
    it("controller should work without socket-connection", () => __awaiter(this, void 0, void 0, function* () {
        const request = {
            url: "~counter~",
            headers: {}, hostname: "", clientIpAddress: "", cookies: {
                sessid: StoreHelper_1.session1Sessid,
            },
        };
        const response = new ExpressResponse_1.default();
        yield storeHelper.store.dispatch("new-http-request", appParentItem, {}, {
            request: request,
            response: response,
        });
        // get seance id
        const storeDump = yield storeHelper.store.dump();
        const seancesIds = Object.keys(storeDump.data.seance);
        const framesIds = Object.keys(storeDump.data["frame-controller"]);
        //
        controller_1.default.instance.emit("newValue");
        yield new Promise((r) => setTimeout(r, 1));
        const socket = {
            on: jest.fn(),
            request,
            conn: {
                remoteAddress: "",
            },
            emit: jest.fn(),
        };
        yield storeHelper.store.dispatch("new-socket-connection", appParentItem, {}, socket);
        const call = socket.on.mock.calls.filter((c) => c[0] === "initialize")[0];
        const cb = jest.fn();
        yield call[1]({ seanceId: seancesIds[0] }, cb);
        expect(socket.emit.mock.calls).toEqual([["frame-controller-data", {
                    data: "newValue",
                    frameId: framesIds[0],
                }]]);
        socket.emit.mockClear();
        controller_1.default.instance.emit("newValue2");
        yield new Promise((r) => setTimeout(r, 1));
        expect(socket.emit.mock.calls).toEqual([["frame-controller-data", {
                    data: "newValue2",
                    frameId: framesIds[0],
                }]]);
    }));
});
