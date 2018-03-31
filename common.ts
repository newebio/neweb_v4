import { IPage } from ".";

export const INITIAL_VAR = "__initial";
export const REQUIRE_FUNC_NAME = "loadModule";
export interface IRemoteFrameControllerDataParams {
    frameId: string;
    data: any;
}
export interface IRemoteFrameControllerDispatchParams {
    frameId: string;
    actionName: string;
    args: any[];
}
export interface IRemoteNewPageParams {
    page: IPage;
}
