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
const onemitter_1 = require("onemitter");
const uid = require("uid-safe");
class GlobalStore {
    constructor(config) {
        this.config = config;
        this.data = {};
        this.objects = {};
        this.actions = {};
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
        for (const typeName of Object.keys(this.config.actions)) {
            this.actions[typeName] = {};
        }
        this.objects.store = {};
        this.objects.store.root = {
            createdAt: new Date(),
            dependents: [],
            object: this,
        };
    }
    dump() {
        return __awaiter(this, void 0, void 0, function* () {
            return {
                actions: this.actions,
                objects: this.objects,
                data: this.data,
            };
        });
    }
    setObject(type, id, parent, object) {
        return __awaiter(this, void 0, void 0, function* () {
            if (Array.isArray(id)) {
                id = id.join("~");
            }
            if (this.objects[type][id]) {
                yield this.removeObject(type, id);
            }
            const parentItem = yield this.getItem(parent);
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
                throw new Error("Not found object `" + type + "` with id " + id);
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
        if (Array.isArray(id)) {
            id = id.join("~");
        }
        if (!this.data[type][id]) {
            this.createData(type, id);
        }
        return this.data[type][id].emitter;
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
    create(type, id, parent, value) {
        return __awaiter(this, void 0, void 0, function* () {
            if (Array.isArray(id)) {
                id = id.join("~");
            }
            yield this.createData(type, id);
            const parentItem = yield this.getItem(parent);
            parentItem.dependents.push({
                type: "data",
                dataType: type,
                id,
            });
            this.data[type][id].parent = parent;
            this.data[type][id].emitter.emit(value);
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
                throw new Error("Not found data with type " + type + " and id " + id);
            }
            this.data[type][id].updatedAt = new Date();
            this.data[type][id].emitter.emit(value);
        });
    }
    has(type, keys) {
        return __awaiter(this, void 0, void 0, function* () {
            const id = Array.isArray(keys) ? keys.join("~") : keys;
            const hasLocal = !!this.data[type][id] && this.data[type][id].emitter.has();
            if (hasLocal) {
                return true;
            }
            return false;
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
            if (this.data[type][id]) {
                return this.data[type][id].emitter.get();
            }
            throw new Error("Not found object " + type + " with id " + id);
        });
    }
    remove(type, id) {
        return __awaiter(this, void 0, void 0, function* () {
            if (Array.isArray(id)) {
                id = id.join("~");
            }
            yield Promise.all(this.data[type][id].dependents.map((dependent) => {
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
    removeAction(eventName, id) {
        return __awaiter(this, void 0, void 0, function* () {
            if (Array.isArray(id)) {
                id = id.join("~");
            }
            delete this.actions[eventName][id];
        });
    }
    action(eventName, parent, params) {
        return __awaiter(this, void 0, void 0, function* () {
            const actionId = yield this.generateId();
            const action = ((store, type, id, parameters, args) => {
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
            const parentItem = yield this.getItem(parent);
            parentItem.dependents.push({
                type: "action",
                actionType: eventName,
                id: actionId,
            });
            return action;
        });
    }
    dispatch(eventName, parent, params, args) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.getItem(parent)) {
                yield this.config.actions[eventName].action(this, params, args);
            }
        });
    }
    getItem(item) {
        return __awaiter(this, void 0, void 0, function* () {
            const id = Array.isArray(item.id) ? item.id.join("~") : item.id;
            if (item.type === "data") {
                return this.data[item.dataType][id];
            }
            if (item.type === "object") {
                return this.objects[item.objectType][id];
            }
            throw new Error("Unknown type " + item);
        });
    }
    createData(type, id) {
        this.data[type][id] = {
            createdAt: new Date(),
            updatedAt: new Date(),
            emitter: onemitter_1.default(),
            dependents: [],
            parent: {},
        };
    }
    generateId() {
        return __awaiter(this, void 0, void 0, function* () {
            const id = new Date().getTime().toString() + (yield uid(7));
            return id;
        });
    }
}
exports.default = GlobalStore;
