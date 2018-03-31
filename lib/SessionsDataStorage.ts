import SessionsStorage from "./SessionsStorage";

export interface ISessionsDataStorageConfig {
    sessionsStorage: SessionsStorage;
}
class SessionsDataStorage {
    constructor(protected config: ISessionsDataStorageConfig) {

    }
    public async getItem(sessionId: string, name: string) {
        const session = await this.config.sessionsStorage.get(sessionId);
        if (session && session.data && typeof (session.data[name]) !== "undefined") {
            return session.data[name];
        }
        return null;
    }
    public async setItem(sessionId: string, name: string, value: any) {
        const session = await this.config.sessionsStorage.get(sessionId);
        if (!session) {
            return;
        }
        session.data = session.data || {};
        session.data[name] = value;
        await this.config.sessionsStorage.set(sessionId, session);
    }
}
export default SessionsDataStorage;
