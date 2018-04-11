import o, { Onemitter } from "onemitter";
import uid = require("uid-safe");
export interface IGlobalStoreDataTypeConfig {
    persistant: boolean;
    lifetime: number;
}
export interface IGlobalStoreObjectTypeConfig {
    lifetime: number;
}
export type IGlobalStoreActionFn<
    ACTIONS extends {
        [index: string]: { params: ACTIONS[ACTIONTYPE]["params"], args: ACTIONS[ACTIONTYPE]["args"] };
    },
    ACTIONTYPE extends keyof ACTIONS
    > = (
        store: GlobalStore<any, any, any>,
        params: ACTIONS[ACTIONTYPE]["params"],
        args: ACTIONS[ACTIONTYPE]["args"],
    ) => void | Promise<void>;

export interface IGlobalStoreActionResolver<ACTIONS extends {
    [index: string]: { params: ACTIONS[ACTIONTYPE]["params"], args: ACTIONS[ACTIONTYPE]["args"] };
}, ACTIONTYPE extends keyof ACTIONS> {
    action: IGlobalStoreActionFn<ACTIONS, ACTIONTYPE>;
}

export interface IGlobalStoreConfig<T, O, ACTIONS extends {
    [index: string]: { params: any, args: any };
}> {
    storePath: string;
    dataTypes: { [P in keyof T]: IGlobalStoreDataTypeConfig };
    objectsTypes: { [P in keyof O]: IGlobalStoreObjectTypeConfig };
    actions: { [P in keyof ACTIONS]: IGlobalStoreActionResolver<ACTIONS, P> };
}

export interface IGlobalStoreObject<T, DATATYPES, OBJECTSTYPES, ACTIONSTYPES> {
    object: T;
    dependents: Array<IGlobalStoreItem<DATATYPES, OBJECTSTYPES, ACTIONSTYPES>>;
    createdAt: Date;
}
export interface IGlobalStoreDataItem<DATATYPES> {
    type: "data";
    dataType: keyof DATATYPES;
    id: string | string[];
}
export interface IGlobalStoreActionItem<ACTIONSTYPES> {
    type: "action";
    actionType: keyof ACTIONSTYPES;
    id: string | string[];
}
export interface IGlobalStoreObjectItem<OBJECTSTYPES> {
    type: "object";
    objectType: keyof OBJECTSTYPES;
    id: string | string[];
}
export type IGlobalStoreItem<DATATYPES, OBJECTSTYPES, ACTIONSTYPES> = IGlobalStoreActionItem<ACTIONSTYPES> |
    IGlobalStoreDataItem<DATATYPES> | IGlobalStoreObjectItem<OBJECTSTYPES>;
export type IGlobalStoreParentItem<DATATYPES, OBJECTSTYPES> =
    IGlobalStoreDataItem<DATATYPES> | IGlobalStoreObjectItem<OBJECTSTYPES>;
class GlobalStore<T, O,
    ACTIONS extends { [index: string]: { params: any, args: any } }> {
    protected data: {
        [P in keyof T]: {
            [index: string]: {
                createdAt: Date;
                updatedAt: Date;
                emitter: Onemitter<T[P]>;
                dependents: Array<IGlobalStoreItem<T, O, ACTIONS>>;
                parent: IGlobalStoreParentItem<T, O>;
            };
        };
    } = {} as any;
    protected objects: { [P in keyof O]: {
        [index: string]: IGlobalStoreObject<O[P], T, O, ACTIONS>;
    } } = {} as any;
    protected actions: { [P in keyof ACTIONS]: {
        [index: string]: {
            action: IGlobalStoreActionFn<ACTIONS, P>;
            parent: IGlobalStoreParentItem<T, O>;
        };
    } } = {} as any;
    protected dataTypes: { [P in keyof T]: IGlobalStoreDataTypeConfig } = {} as any;
    protected objectsTypes: { [P in keyof O]: IGlobalStoreObjectTypeConfig } = {} as any;
    constructor(protected config: IGlobalStoreConfig<T, O, ACTIONS>) {
        this.dataTypes = this.config.dataTypes;
        this.objectsTypes = this.config.objectsTypes;
        for (const typeName of Object.keys(this.config.dataTypes)) {
            (this.data as any)[typeName] = {};
        }
        for (const typeName of Object.keys(this.config.objectsTypes)) {
            (this.objects as any)[typeName] = {};
        }
        for (const typeName of Object.keys(this.config.actions)) {
            (this.actions as any)[typeName] = {};
        }
        (this.objects as any).store = {};
        (this.objects as any).store.root = {
            createdAt: new Date(),
            dependents: [],
            object: this,
        };
    }
    public async dump() {
        return {
            actions: this.actions,
            objects: this.objects,
            data: this.data,
        };
    }
    public async setObject<P extends keyof O>(
        type: P,
        id: string | string[],
        parent: IGlobalStoreParentItem<T, O>,
        object: O[P]): Promise<void> {
        if (Array.isArray(id)) {
            id = id.join("~");
        }
        if (this.objects[type][id]) {
            await this.removeObject(type, id);
        }
        const parentItem = await this.getItem(parent);
        parentItem.dependents.push({
            type: "object",
            objectType: type,
            id,
        });
        this.objects[type][id] = {
            createdAt: new Date(),
            dependents: [],
            object,
        };
    }
    public async removeObjectByInstance<P extends keyof O>(type: P, instance: O[P]) {
        const objectId = Object.keys(this.objects[type]).find((key) => this.objects[type][key].object === instance);
        if (objectId) {
            delete this.objects[type][objectId];
        }
    }
    public async getObject<P extends keyof O>(type: P, id: string | string[]): Promise<O[P]> {
        if (Array.isArray(id)) {
            id = id.join("~");
        }
        if (!this.objects[type][id]) {
            throw new Error("Not found object `" + type + "` with id " + id);
        }
        return this.objects[type][id].object;
    }
    public async hasObject<P extends keyof O>(type: P, id: string | string[]): Promise<boolean> {
        if (Array.isArray(id)) {
            id = id.join("~");
        }
        if (!this.objects[type][id]) {
            return false;
        }
        return true;
    }
    public async removeObject(type: keyof O, id: string | string[]) {
        if (Array.isArray(id)) {
            id = id.join("~");
        }
        if (this.objects[type][id]) {
            delete this.objects[type][id];
        }
    }
    public getEmitter(type: keyof T, id: string | string[]): Onemitter<T[keyof T]> {
        if (Array.isArray(id)) {
            id = id.join("~");
        }
        if (!this.data[type][id]) {
            this.createData(type, id);
        }
        return this.data[type][id].emitter;
    }
    public async findId<P extends keyof T>(type: P, filter: (value: T[P]) => boolean): Promise<string> {
        const id = Object.keys(this.data[type]).find((v) => this.data[type][v].emitter.has()
            && filter(this.data[type][v].emitter.get()));
        if (!id) {
            throw new Error("Not found value by filter " + filter);
        }
        return id;
    }
    public async create<P extends keyof T>(
        type: P, id: string | string[],
        parent: IGlobalStoreParentItem<T, O>,
        value: T[P]) {
        if (Array.isArray(id)) {
            id = id.join("~");
        }
        await this.createData(type, id);
        const parentItem = await this.getItem(parent);
        parentItem.dependents.push({
            type: "data",
            dataType: type,
            id,
        });
        this.data[type][id].parent = parent;
        this.data[type][id].emitter.emit(value);
    }
    public async set<P extends keyof T>(type: P, keys: string | string[], value: T[P]): Promise<void> {
        let id: string;
        if (Array.isArray(keys)) {
            id = keys.join("~");
        } else {
            id = keys;
            keys = [keys];
        }
        if (!this.data[type][id]) {
            throw new Error("Not found data with type " + type + " and id " + id);
        }
        this.data[type][id].updatedAt = new Date();
        this.data[type][id].emitter.emit(value);
    }
    public async has(type: keyof T, keys: string | string[]): Promise<boolean> {
        const id = Array.isArray(keys) ? keys.join("~") : keys;
        const hasLocal = !!this.data[type][id] && this.data[type][id].emitter.has();
        if (hasLocal) {
            return true;
        }
        return false;
    }
    public async getMaybe<P extends keyof T>(type: P, id: string | string[]): Promise<T[P] | undefined> {
        if (Array.isArray(id)) {
            id = id.join("~");
        }
        if (!this.data[type][id] || !this.data[type][id].emitter.has()) {
            return undefined;
        }
        return this.data[type][id].emitter.get();
    }
    public async get<P extends keyof T>(type: P, id: string | string[]): Promise<T[P]> {
        if (Array.isArray(id)) {
            id = id.join("~");
        }
        if (this.data[type][id]) {
            return this.data[type][id].emitter.get();
        }
        throw new Error("Not found object " + type + " with id " + id);
    }
    public async remove(type: keyof T, id: string | string[]): Promise<void> {
        if (Array.isArray(id)) {
            id = id.join("~");
        }
        await Promise.all(this.data[type][id].dependents.map((dependent) => {
            switch (dependent.type) {
                case "data":
                    return this.remove(dependent.dataType, dependent.id);
                case "object":
                    return this.removeObject(dependent.objectType, dependent.id);
                case "action":
                    return this.removeAction(dependent.actionType, dependent.id);
            }
        }));
        if (this.data[type][id]) {
            delete this.data[type][id];
        }
    }
    public createContainer(params: {
        key: (...args: any[]) => {
            type: keyof T;
            keys: string[] | string;
        };
    }) {
        return {
            get: (...args: any[]) => {
                const p = params.key(...args);
                return this.getEmitter(p.type, p.keys);
            },
            set: (...args: any[]) => {
                const value = args.pop();
                const p = params.key(...args);
                return this.set(p.type, p.keys, value);
            },
        };
    }
    public async removeAction<P extends keyof ACTIONS>(eventName: P, id: string | string[]) {
        if (Array.isArray(id)) {
            id = id.join("~");
        }
        delete this.actions[eventName][id];
    }
    public async action<P extends keyof ACTIONS>(
        eventName: P,
        parent: IGlobalStoreParentItem<T, O>,
        params: ACTIONS[P]["params"]):
        Promise<(args: ACTIONS[P]["args"]) => void | Promise<void>> {
        const actionId = await this.generateId();
        const action = ((
            store: GlobalStore<any, any, any>,
            type: P,
            id: string | string[],
            parameters: ACTIONS[P]["params"],
            args: ACTIONS[P]["args"],
        ) => {
            if (Array.isArray(id)) {
                id = id.join("~");
            }
            if (store.actions[type][id]) {
                return store.config.actions[type].action(store, parameters, args);
            }
            return;
        }).bind(undefined, this, eventName, actionId, params);
        this.actions[eventName][actionId] = {
            action,
            parent,
        };
        const parentItem = await this.getItem(parent);
        parentItem.dependents.push({
            type: "action",
            actionType: eventName,
            id: actionId,
        });
        return action;
    }
    public async dispatch<P extends keyof ACTIONS>(
        eventName: P,
        parent: IGlobalStoreParentItem<T, O>,
        params: ACTIONS[P]["params"], args: ACTIONS[P]["args"]): Promise<void> {
        if (this.getItem(parent)) {
            await this.config.actions[eventName].action(this, params, args);
        }
    }
    protected async getItem(item: IGlobalStoreItem<T, O, ACTIONS>): Promise<{
        dependents: Array<IGlobalStoreItem<T, O, ACTIONS>>;
    }> {
        const id = Array.isArray(item.id) ? item.id.join("~") : item.id;
        if (item.type === "data") {
            return this.data[item.dataType][id];
        }
        if (item.type === "object") {
            return this.objects[item.objectType][id];
        }
        throw new Error("Unknown type " + item);
    }
    protected createData(type: keyof T, id: string) {
        this.data[type][id] = {
            createdAt: new Date(),
            updatedAt: new Date(),
            emitter: o(),
            dependents: [],
            parent: {} as any,
        };
    }
    protected async generateId() {
        const id = new Date().getTime().toString() + await uid(7);
        return id;
    }
}
export default GlobalStore;
