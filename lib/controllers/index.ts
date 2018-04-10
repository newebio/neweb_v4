import { ISessionContext, NewebGlobalStore } from "../..";

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
    controller.off(await store.getObject("frame-controller-data-callback", frameId));
    await store.removeObject("frame-controller-object", frameId);
    await store.removeObject("frame-controller-data-callback", frameId);
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
    await store.setObject("frame-controller-object", params.frameId, controller);
    const data = await controller.getInitialData();
    controller.emit(data);

    controller.on(await store.action("new-controller-data", params.frameId));
    // TODO store.set("frame-controller-data", params.frameId, value);
    /*const socketId = await this.config.store.get("seance-socket", seanceId);
    if (socketId) {
        if (await this.config.store.hasObject("socket", socketId)) {
            const socket = await this.config.store.getObject("socket", socketId);
            socket.emit("frame-controller-data", {
                frameId: frame.frameId,
                data: value,
            });
        }
    }*/
    await store.set("frame-controller", params.frameId, {
        seanceId: params.seanceId,
        sessionId: params.sessionId,
        objectId: params.frameId,
    });
}
