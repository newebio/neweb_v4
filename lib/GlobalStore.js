"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const mkdirp = require("mkdirp");
const onemitter_1 = require("onemitter");
const path_1 = require("path");
const uid = require("uid-safe");
const util_1 = require("util");
class GlobalStore {
    constructor(config) {
        this.config = config;
        this.data = {};
        this.objects = {};
        this.dataTypes = {};
        this.objectsTypes = {};
        this.dataTypes = this.config.dataTypes;
        this.objectsTypes = this.config.objectsTypes;
        for (const typeName of Object.keys(this.config.dataTypes)) {
            this.data[typeName] = {};
        }
        for (const typeName of Object.keys(this.config.objectsTypes)) {
            this.objects[typeName] = {};
        }
    }
    getAllData() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.data;
        });
    }
    setObject(type, id, object) {
        return __awaiter(this, void 0, void 0, function* () {
            if (Array.isArray(id)) {
                id = id.join("~");
            }
            this.objects[type][id] = {
                createdAt: new Date(),
                object,
            };
        });
    }
    removeObjectByInstance(type, instance) {
        return __awaiter(this, void 0, void 0, function* () {
            const objectId = Object.keys(this.objects[type]).find((key) => this.objects[type][key].object === instance);
            if (objectId) {
                delete this.objects[type][objectId];
            }
        });
    }
    getObject(type, id) {
        return __awaiter(this, void 0, void 0, function* () {
            if (Array.isArray(id)) {
                id = id.join("~");
            }
            if (!this.objects[type][id]) {
                throw new Error("Not found object with id " + id);
            }
            return this.objects[type][id].object;
        });
    }
    hasObject(type, id) {
        return __awaiter(this, void 0, void 0, function* () {
            if (Array.isArray(id)) {
                id = id.join("~");
            }
            if (!this.objects[type][id]) {
                return false;
            }
            return true;
        });
    }
    removeObject(type, id) {
        return __awaiter(this, void 0, void 0, function* () {
            if (Array.isArray(id)) {
                id = id.join("~");
            }
            if (this.objects[type][id]) {
                delete this.objects[type][id];
            }
        });
    }
    getEmitter(type, id) {
        return __awaiter(this, void 0, void 0, function* () {
            if (Array.isArray(id)) {
                id = id.join("~");
            }
            if (!this.data[type][id]) {
                yield this.create(type, id);
            }
            return this.data[type][id].emitter;
        });
    }
    findId(type, filter) {
        return __awaiter(this, void 0, void 0, function* () {
            const id = Object.keys(this.data[type]).find((v) => this.data[type][v].emitter.has()
                && filter(this.data[type][v].emitter.get()));
            if (!id) {
                throw new Error("Not found value by filter " + filter);
            }
            return id;
        });
    }
    create(type, id) {
        return __awaiter(this, void 0, void 0, function* () {
            if (Array.isArray(id)) {
                id = id.join("~");
            }
            this.data[type][id] = {
                createdAt: new Date(),
                updatedAt: new Date(),
                emitter: onemitter_1.default(),
            };
        });
    }
    set(type, keys, value) {
        return __awaiter(this, void 0, void 0, function* () {
            let id;
            if (Array.isArray(keys)) {
                id = keys.join("~");
            }
            else {
                id = keys;
                keys = [keys];
            }
            if (!this.data[type][id]) {
                yield this.create(type, id);
            }
            if (this.dataTypes[type].persistant) {
                const objectPath = path_1.resolve(path_1.join(this.config.storePath, type, ...keys, ".json"));
                yield util_1.promisify(mkdirp)(path_1.dirname(objectPath));
                yield util_1.promisify(fs_1.writeFile)(objectPath, JSON.stringify(value));
            }
            this.data[type][id].updatedAt = new Date();
            this.data[type][id].emitter.emit(value);
        });
    }
    has(type, id) {
        return __awaiter(this, void 0, void 0, function* () {
            if (Array.isArray(id)) {
                id = id.join("~");
            }
            return !!this.data[type][id] && this.data[type][id].emitter.has();
        });
    }
    getMaybe(type, id) {
        return __awaiter(this, void 0, void 0, function* () {
            if (Array.isArray(id)) {
                id = id.join("~");
            }
            if (!this.data[type][id] || !this.data[type][id].emitter.has()) {
                return undefined;
            }
            return this.data[type][id].emitter.get();
        });
    }
    get(type, id) {
        return __awaiter(this, void 0, void 0, function* () {
            if (Array.isArray(id)) {
                id = id.join("~");
            }
            if (!this.data[type][id]) {
                throw new Error("Not found object " + type + " with id " + id);
            }
            return this.data[type][id].emitter.get();
        });
    }
    remove(type, id) {
        return __awaiter(this, void 0, void 0, function* () {
            if (Array.isArray(id)) {
                id = id.join("~");
            }
            if (this.data[type][id]) {
                delete this.data[type][id];
            }
        });
    }
    createContainer(params) {
        return {
            get: (...args) => {
                const p = params.key(...args);
                return this.getEmitter(p.type, p.keys);
            },
            set: (...args) => {
                const value = args.pop();
                const p = params.key(...args);
                return this.set(p.type, p.keys, value);
            },
        };
    }
    action(eventName, params) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.config.actions[eventName].action.bind(undefined, this, params);
        });
    }
    dispatch(eventName, params, args) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.config.actions[eventName].action(this, params, args);
        });
    }
    generateId() {
        return __awaiter(this, void 0, void 0, function* () {
            const id = new Date().getTime().toString() + (yield uid(7));
            return id;
        });
    }
}
exports.default = GlobalStore;
