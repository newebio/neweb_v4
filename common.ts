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
export { default as NavigateContext } from "./client/NavigateContext";
export { default as SeansStatusContext } from "./client/SeansStatusContext";
export { default as NetworkStatusContext } from "./client/NetworkStatusContext";
export { default as HistoryContext } from "./client/HistoryContext";
export { default as Link } from "./client/Link";
export { default as Styled } from "./lib/Styled";
