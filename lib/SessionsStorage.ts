import { exists, readFile, writeFile } from "fs";
import mkdirp = require("mkdirp");
import { dirname, join, resolve } from "path";
import { promisify } from "util";
import { ISession } from "../typings";

export interface ISessionsStorageConfig {
    sessionsPath: string;
}
class SessionsStorage {
    constructor(protected config: ISessionsStorageConfig) { }
    public async get(id: string): Promise<ISession | null> {
        const sessionPath = this.getSessionPath(id);
        if (!await promisify(exists)(sessionPath)) {
            return null;
        }
        try {
            const data = (await promisify(readFile)(sessionPath)).toString();
            return JSON.parse(data);
        } catch (e) {
            return null;
        }
    }
    public async set(id: string, data: ISession) {
        const sessionPath = this.getSessionPath(id);
        await promisify(mkdirp)(dirname(sessionPath));
        await promisify(writeFile)(sessionPath, JSON.stringify(data));
    }
    protected getSessionPath(id: string) {
        return resolve(join(this.config.sessionsPath, id, "sessions.json"));
    }
}
export default SessionsStorage;
