import { resolve } from "path";
import { IRequest, ISeanceDumpInfo } from "./..";
import { IGlobalStoreParentItem } from "./../lib/GlobalStore";
import ExpressResponse from "./../lib/testutil/ExpressResponse";
import StoreHelper, { session1Sessid } from "./../lib/testutil/StoreHelper";
const appPath = resolve(__dirname + "/../__fixtures__/app");
import { page1RootFrame as page1RootFrameModule } from "./../__mocks__/neweb-pack";

const appParentItem: IGlobalStoreParentItem<any, any> = {
    type: "object",
    objectType: "app",
    id: "default",
};
describe("http::tests", () => {
    let storeHelper: StoreHelper;
    beforeEach(async () => {
        storeHelper = new StoreHelper({
            appPath,
        });
        await storeHelper.initialize();
    });
    it("when request not found response should be with status - 404", async () => {
        const request: IRequest = {
            url: "~not-found~",
            headers: {}, hostname: "", clientIpAddress: "", cookies: {
                sessid: session1Sessid,
            },
        };
        const response = new ExpressResponse();
        await storeHelper.store.dispatch("new-http-request", appParentItem, {}, {
            request: request as any,
            response: response as any,
        });
        expect(response.getResponse()).toEqual({
            statusCode: 404,
            body: "NF1",
            headers: {},
            cookies: {},
        });
    });
    it("when request need redirect, response should with status 302", async () => {
        const request: IRequest = {
            url: "~redirect~",
            headers: {}, hostname: "", clientIpAddress: "", cookies: {
                sessid: session1Sessid,
            },
        };
        const response = new ExpressResponse();
        await storeHelper.store.dispatch("new-http-request", appParentItem, {}, {
            request: request as any,
            response: response as any,
        });
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
        await storeHelper.store.dispatch("new-http-request", appParentItem, {}, {
            request: request as any,
            response: response as any,
        });
        const storeDump = await storeHelper.store.dump();
        const seancesIds = Object.keys(storeDump.data.seance);
        const framesIds = Object.keys(storeDump.data["frame-controller"]);
        expect(seancesIds.length).toBe(1);
        expect(framesIds.length).toBe(1);
        const seanceId = seancesIds[0];
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
