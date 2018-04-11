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
const http_1 = require("./http");
const ExpressResponse_1 = require("./testutil/ExpressResponse");
const StoreHelper_1 = require("./testutil/StoreHelper");
const appPath = path_1.resolve(__dirname + "/../__fixtures__/app");
const neweb_pack_1 = require("./../__mocks__/neweb-pack");
const request1Id = "request1IdValue";
const appParentItem = {
    type: "object",
    objectType: "app",
    id: "default",
};
describe("http::tests", () => {
    let storeHelper;
    beforeEach(() => __awaiter(this, void 0, void 0, function* () {
        storeHelper = new StoreHelper_1.default({
            appPath,
        });
        yield storeHelper.initialize();
    }));
    it("when request not found response should be with status - 404", () => __awaiter(this, void 0, void 0, function* () {
        const request = {
            url: "~not-found~",
            headers: {}, hostname: "", clientIpAddress: "", cookies: {
                sessid: StoreHelper_1.session1Sessid,
            },
        };
        yield storeHelper.store.create("request", request1Id, appParentItem, request);
        const response = new ExpressResponse_1.default();
        yield storeHelper.store.setObject("http-response", request1Id, appParentItem, response);
        yield http_1.onRequest(storeHelper.store, request1Id);
        expect(response.getResponse()).toEqual({
            statusCode: 404,
            body: "NF1",
            headers: {},
            cookies: {},
        });
    }));
    it("when request need redirect, response should with status 302", () => __awaiter(this, void 0, void 0, function* () {
        const request = {
            url: "~redirect~",
            headers: {}, hostname: "", clientIpAddress: "", cookies: {
                sessid: StoreHelper_1.session1Sessid,
            },
        };
        yield storeHelper.store.create("request", request1Id, appParentItem, request);
        const response = new ExpressResponse_1.default();
        yield storeHelper.store.setObject("http-response", request1Id, appParentItem, response);
        yield http_1.onRequest(storeHelper.store, request1Id);
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
                sessid: StoreHelper_1.session1Sessid,
            },
            url: "~page1~",
        };
        yield storeHelper.store.create("request", request1Id, appParentItem, request);
        const response = new ExpressResponse_1.default();
        yield storeHelper.store.setObject("http-response", request1Id, appParentItem, response);
        yield http_1.onRequest(storeHelper.store, request1Id);
        const storeDump = yield storeHelper.store.dump();
        const seancesIds = Object.keys(storeDump.data.seance);
        const framesIds = Object.keys(storeDump.data["frame-controller"]);
        expect(seancesIds.length).toBe(1);
        expect(framesIds.length).toBe(1);
        const seanceId = seancesIds[0];
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
                        frameVersion: neweb_pack_1.page1RootFrame.version,
                        modules: neweb_pack_1.page1RootFrame.modules.concat({
                            name: neweb_pack_1.page1RootFrame.name,
                            version: neweb_pack_1.page1RootFrame.version,
                            type: neweb_pack_1.page1RootFrame.type,
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
            cookies: { sessid: StoreHelper_1.session1Sessid },
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
