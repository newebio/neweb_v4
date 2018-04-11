import { ModulePacker } from "neweb-pack";
import { REQUIRE_FUNC_NAME } from "../../common";
import { IDataRegistry, IObjectsRegistry, IRegistryActions } from "./../..";
import actions from "./../actions";
import Application from "./../Application";
import GlobalStore from "./../GlobalStore";
export const session1Id = "session1IdValue";
export const session1Hash = "session1HashValue";
export const session1Sessid = session1Id + ":" + session1Hash;
class StoreHelper {
    /*public actions: {[P in keyof IRegistryActions]:
        IGlobalStoreActionResolver<IRegistryActions, P>} = {
            "new-controller-data": { action: jest.fn() },
            "new-http-request": { action: jest.fn() },
            "new-router-route": { action: jest.fn() },
            "new-socket-connection": { action: jest.fn() },
            "seance-navigate": { action: jest.fn() },
        };*/
    public store = new GlobalStore<IDataRegistry, IObjectsRegistry, IRegistryActions>({
        storePath: __dirname + "/../tmp",
        dataTypes: {
            "session": { lifetime: 1000, persistant: false },
            "session-data": { lifetime: 1000, persistant: false },
            "frame-controller": { lifetime: 1000, persistant: false },
            "frame-controller-data": { lifetime: 1000, persistant: false },
            "seance": { lifetime: 1000, persistant: false },
            "seance-socket": { lifetime: 1000, persistant: false },
            "seance-current-page": { lifetime: 1000, persistant: false },
            "seance-request": { lifetime: 1000, persistant: false },
            "request": { lifetime: 1000, persistant: false },
        },
        objectsTypes: {
            "store": { lifetime: 0 },
            "http-request": { lifetime: 1000 },
            "http-response": { lifetime: 1000 },
            "app": { lifetime: 1000 },
            "frame-controller-object": { lifetime: 1000 },
            "socket": { lifetime: 1000 },
            "router": { lifetime: 1000 },
        },
        actions,
    });
    constructor(protected config: { appPath: string }) {
    }
    public async initialize() {
        const modulePacker = new ModulePacker({
            appRoot: this.config.appPath,
            excludedModules: ["react", "react-dom", "neweb"],
            modulesPath: __dirname + "/../tmp",
            REQUIRE_FUNC_NAME,
        });
        const app = new Application({
            environment: "development",
            appPath: this.config.appPath,
            modulePacker: modulePacker as any,
        });
        await this.store.setObject("app", "default", {
            type: "object",
            objectType: "store",
            id: "root",
        }, app);
        await this.store.create("session", session1Id, {
            type: "object",
            objectType: "app",
            id: "default",
        }, { id: session1Id, hash: session1Hash });
        await this.store.create("session-data", [session1Id, "session1Item1"], {
            type: "data",
            dataType: "session",
            id: session1Id,
        }, "session1Item1Value");
    }
}
export default StoreHelper;
