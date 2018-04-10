import SessionContext from "../SessionContext";
import { IRequest } from "./../..";

class SessionsManager {
    protected sessions = [{
        sid: "sid1",
        id: "sessid1",
        context: new SessionContext({
            data: {
                session1Item1: "session1Item1Value",
            },
            onSave: jest.fn(),
        }),
    }];
    public getById(id: string) {
        return this.sessions.find((s) => s.id === id);
    }
    public getBySid(sid: string) {
        const session = this.sessions.find((s) => s.sid === sid);
        if (!session) {
            throw new Error("Unknown session by sid " + sid);
        }
        return session;
    }
    public getSessionContext(id: string) {
        const session = this.sessions.find((s) => s.id === id);
        if (session) {
            return session.context;
        }
        throw new Error("Unknown session id");
    }
    public resolveSessionIdByRequest(request: IRequest) {
        const session = this.sessions.find((s) => s.sid === request.headers.sid);
        if (!session) {
            throw new Error("Unknown session");
        }
        return session.id;
    }
}
export default SessionsManager;
