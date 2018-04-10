import { writeFile } from "fs";
import mkdirp = require("mkdirp");
import o, { Onemitter } from "onemitter";
import { dirname, join, resolve } from "path";
import uid = require("uid-safe");
import { promisify } from "util";
export interface IGlobalStoreDataTypeConfig {
    persistant: boolean;
    lifetime: number;
}
export interface IGlobalStoreObjectTypeConfig {
    lifetime: number;
}
export interface IGlobalStoreConfig<T, O> {
    storePath: string;
    dataTypes: {[P in keyof T]: IGlobalStoreDataTypeConfig};
    objectsTypes: {[P in keyof O]: IGlobalStoreObjectTypeConfig};
}
export interface IGlobalStoreObject<T> {
    object: T;
    createdAt: Date;
}
class GlobalStore<T, O, A> {
    protected data: {
        [P in keyof T]: {
            [index: string]: {
                createdAt: Date;
                updatedAt: Date;
                emitter: Onemitter<T[P]>;
            };
        };
    } = {} as any;
    protected objects: {[P in keyof O]: {
        [index: string]: IGlobalStoreObject<O[P]>;
    }  } = {} as any;
    protected dataTypes: {[P in keyof T]: IGlobalStoreDataTypeConfig } = {} as any;
    protected objectsTypes: {[P in keyof O]: IGlobalStoreObjectTypeConfig } = {} as any;
    constructor(protected config: IGlobalStoreConfig<T, O>) {
        this.dataTypes = this.config.dataTypes;
        this.objectsTypes = this.config.objectsTypes;
        for (const typeName of Object.keys(this.config.dataTypes)) {
            (this.data as any)[typeName] = {};
        }
        for (const typeName of Object.keys(this.config.objectsTypes)) {
            (this.objects as any)[typeName] = {};
        }
    }
    public async getAllData() {
        return this.data;
    }
    public async setObject<P extends keyof O>(type: P, id: string | string[], object: O[P]): Promise<void> {
        if (Array.isArray(id)) {
            id = id.join("~");
        }
        this.objects[type][id] = {
            createdAt: new Date(),
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
            throw new Error("Not found object with id " + id);
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
    public async getEmitter(type: keyof T, id: string | string[]): Promise<Onemitter<T[keyof T]>> {
        if (Array.isArray(id)) {
            id = id.join("~");
        }
        if (!this.data[type][id]) {
            await this.create(type, id);
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
    public async create(type: keyof T, id: string | string[]) {
        if (Array.isArray(id)) {
            id = id.join("~");
        }
        this.data[type][id] = {
            createdAt: new Date(),
            updatedAt: new Date(),
            emitter: o(),
        };
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
            await this.create(type, id);
        }
        if (this.dataTypes[type].persistant) {
            const objectPath = resolve(join(this.config.storePath, type, ...keys, ".json"));
            await promisify(mkdirp)(dirname(objectPath));
            await promisify(writeFile)(objectPath, JSON.stringify(value));
        }
        this.data[type][id].updatedAt = new Date();
        this.data[type][id].emitter.emit(value);
    }
    public async has(type: keyof T, id: string | string[]): Promise<boolean> {
        if (Array.isArray(id)) {
            id = id.join("~");
        }
        return !!this.data[type][id] && this.data[type][id].emitter.has();
    }
    public async getMaybe(type: keyof T, id: string | string[]): Promise<T[keyof T] | undefined> {
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
        if (!this.data[type][id]) {
            throw new Error("Not found object " + type + " with id " + id);
        }
        return this.data[type][id].emitter.get();
    }
    public async remove(type: keyof T, id: string | string[]): Promise<void> {
        if (Array.isArray(id)) {
            id = id.join("~");
        }
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
    public async action<P extends keyof A>(eventName: P, id: string | string[]):
        Promise<(params: A[P]) => void | Promise<void>> {
        return null as any;
    }
    public async dispatch<P extends keyof A>(eventName: P, id: string | string[], params: A[P]): Promise<void> {

    }
    protected async generateId() {
        const id = new Date().getTime().toString() + await uid(7);
        return id;
    }
}
export default GlobalStore;
