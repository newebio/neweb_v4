import { resolve } from "path";
import { IRequest } from "..";
import CounterController from "../__fixtures__/app/frames/counter/controller";
import { IGlobalStoreParentItem } from "../lib/GlobalStore";
import ExpressResponse from "../lib/testutil/ExpressResponse";
import StoreHelper, { session1Sessid } from "./../lib/testutil/StoreHelper";
const appPath = resolve(__dirname + "/../__fixtures__/app");
const appParentItem: IGlobalStoreParentItem<any, any> = {
    type: "object",
    objectType: "app",
    id: "default",
};
describe("sockets::tests", () => {
    let storeHelper: StoreHelper;
    beforeEach(async () => {
        storeHelper = new StoreHelper({
            appPath,
        });
        await storeHelper.initialize();
    });
    it("controller should work without socket-connection", async () => {
        const request: IRequest = {
            url: "~counter~",
            headers: {}, hostname: "", clientIpAddress: "", cookies: {
                sessid: session1Sessid,
            },
        };
        const response = new ExpressResponse();
        await storeHelper.store.dispatch("new-http-request", appParentItem, {}, {
            request: request as any,
            response: response as any,
        });
        // get seance id
        const storeDump = await storeHelper.store.dump();
        const seancesIds = Object.keys(storeDump.data.seance);
        const framesIds = Object.keys(storeDump.data["frame-controller"]);
        //
        CounterController.instance.emit("newValue");
        await new Promise((r) => setTimeout(r, 1));
        const socket = {
            on: jest.fn(),
            request,
            conn: {
                remoteAddress: "",
            },
            emit: jest.fn(),
        };
        await storeHelper.store.dispatch("new-socket-connection", appParentItem, {}, socket as any);
        const call = socket.on.mock.calls.filter((c) => c[0] === "initialize")[0];
        const cb = jest.fn();
        await call[1]({ seanceId: seancesIds[0] }, cb);
        expect(socket.emit.mock.calls).toEqual([["frame-controller-data", {
            data: "newValue",
            frameId: framesIds[0],
        }]]);
        socket.emit.mockClear();
        CounterController.instance.emit("newValue2");
        await new Promise((r) => setTimeout(r, 1));
        expect(socket.emit.mock.calls).toEqual([["frame-controller-data", {
            data: "newValue2",
            frameId: framesIds[0],
        }]]);
    });
});
