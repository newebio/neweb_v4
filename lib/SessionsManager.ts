import { Response } from "express";

import { IRequest, ISessionContext, NewebGlobalStore } from "../typings";
export interface ISessionsManagerConfig {
    store: NewebGlobalStore;
}
class SessionsManager {
    constructor(protected config: ISessionsManagerConfig) {

    }
}
export default SessionsManager;
