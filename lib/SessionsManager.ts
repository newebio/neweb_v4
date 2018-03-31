import { Response } from "express";
import uid = require("uid-safe");
import { IRequest, ISession, ISessionContext } from "../typings";
import SessionsDataStorage from "./SessionsDataStorage";
import SessionsStorage from "./SessionsStorage";
export interface ISessionsManagerConfig {
    sessionsStorage: SessionsStorage;
    sessionsDataStorage: SessionsDataStorage;
}
class SessionsManager {
    protected sessions: {
        [index: string]: {
            session: ISession;
            hash: string;
            context: ISessionContext;
        };
    } = {};
    constructor(protected config: ISessionsManagerConfig) {

    }
    public async getSessionContext(sessionId: string) {
        const session = await this.getSessionById(sessionId);
        if (!session) {
            throw new Error("Not found session " + sessionId);
        }
        return session.context;
    }
    public async enrichResponse(sessionId: string, response: Response) {
        const session = this.sessions[sessionId];
        response.cookie("sessid", sessionId + ":" + session.hash);
    }
    public async resolveSessionIdByRequest(request: IRequest) {
        let sessid = request.cookies.sessid;
        let sessionId: string;
        if (!sessid) {
            sessionId = (await this.createSession(request)).id;
        } else {
            if (Array.isArray(sessid)) {
                sessid = sessid[0];
            }
            const [id, hash] = sessid.split(":");
            sessionId = id;
            if (!this.sessions[id]) {
                await this.loadSession(id);
            }
            if (!this.sessions[id] || this.sessions[id].hash !== hash) {
                sessionId = (await this.createSession(request)).id;
            }
        }
        return this.sessions[sessionId].session.id;
    }
    protected async createSession(_: IRequest) {
        const id = new Date().getTime().toString() + await uid(7);
        const hash = await uid(32);
        const sessid = id + ":" + hash;
        const session = {
            id,
            hash,
            sessid,
            data: {},
        };
        this.sessions[id] = {
            session, hash, context: this.createSessionContext(id),
        };
        await this.config.sessionsStorage.set(id, session);
        return session;
    }
    protected async loadSession(sessionId: string) {
        const sessionData = await this.config.sessionsStorage.get(sessionId);
        if (!sessionData) {
            return;
        }
        const session = { ...sessionData };
        this.sessions[sessionId] = { session, hash: sessionData.hash, context: this.createSessionContext(sessionId) };
    }
    protected createSessionContext(id: string) {
        return {
            getItem: (name: string) => this.config.sessionsDataStorage.getItem(id, name),
            setItem: (name: string, value: any) => this.config.sessionsDataStorage.setItem(id, name, value),
        };
    }
    protected async getSessionById(sessionId: string) {
        if (!this.sessions[sessionId]) {
            await this.loadSession(sessionId);
        }
        if (!this.sessions[sessionId]) {
            return null;
        }
        return this.sessions[sessionId];
    }
}
export default SessionsManager;
