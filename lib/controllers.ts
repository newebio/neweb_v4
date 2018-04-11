import { ISessionContext, NewebGlobalStore } from "./..";

export interface ICreateControllerParams {
    frameId: string;
    seanceId: string;
    sessionId: string;
    frameName: string;
    params: any;
    session: ISessionContext;
    context: any;
    navigate: (url: string) => void;
}
export async function resolveController(store: NewebGlobalStore, params: ICreateControllerParams) {
    if (!await store.has("frame-controller", params.frameId)) {
        await createController(store, params);
    }
}
export async function getControllerData(store: NewebGlobalStore, frameId: string) {
    return store.getMaybe("frame-controller-data", frameId);
}
export async function getController(store: NewebGlobalStore, frameId: string) {
    return store.getObject("frame-controller-object", frameId);
}
export async function disposeController(store: NewebGlobalStore, frameId: string) {
    const controller = await store.getObject("frame-controller-object", frameId);
    await controller.dispose();
    controller.removeAllListeners();
    await store.removeObject("frame-controller-object", frameId);
    await store.remove("frame-controller", frameId);
}
export async function onNewFrameControllerData(store: NewebGlobalStore, frameId: string, value: any) {
    await store.set("frame-controller-data", frameId, value);
    const controller = await store.get("frame-controller", frameId);
    const seanceId = controller.seanceId;
    const socketId = await store.get("seance-socket", seanceId);
    if (socketId) {
        if (await store.hasObject("socket", socketId)) {
            const socket = await store.getObject("socket", socketId);
            socket.emit("frame-controller-data", {
                frameId,
                data: value,
            });
        }
    }
}
export async function createController(store: NewebGlobalStore, params: ICreateControllerParams) {
    const app = await store.getObject("app", "default");
    const ControllerClass = await app.getFrameControllerClass(params.frameName);
    const controller = new ControllerClass({
        context: params.context,
        data: undefined,
        navigate: params.navigate,
        params: params.params,
        session: params.session,
    });
    await store.create("frame-controller", params.frameId, {
        type: "data",
        dataType: "seance",
        id: params.seanceId,
    }, {
            seanceId: params.seanceId,
            sessionId: params.sessionId,
            objectId: params.frameId,
        });
    await store.setObject("frame-controller-object", params.frameId, {
        type: "data",
        dataType: "frame-controller",
        id: params.frameId,
    }, controller);
    const data = await controller.getInitialData();
    controller.emit(data);

    // subscribe to controller emitting
    controller.on(await store.action("new-controller-data", {
        type: "data",
        dataType: "frame-controller",
        id: params.frameId,
    }, { frameId: params.frameId }));
}
