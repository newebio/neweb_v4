import { IPackInfoModule } from "neweb-pack";
import React = require("react");
import ReactDOM = require("react-dom");
import { REQUIRE_FUNC_NAME } from "./../common";
import NewebCommon = require("./../common");
export interface IModulesManagerConfig {
    address: string;
}
class ClientModulesManager {
    protected modules: Array<{
        name: string;
        version?: string;
        type: string;
        exports: any;
        content: string;
    }> = [];
    constructor(protected config: IModulesManagerConfig) {
        this.modules.push({
            name: "react",
            version: undefined,
            type: "npm",
            content: "",
            exports: React,
        });
        this.modules.push({
            name: "react-dom",
            version: undefined,
            type: "npm",
            content: "",
            exports: ReactDOM,
        });
        this.modules.push({
            name: "neweb",
            version: undefined,
            type: "npm",
            content: "",
            exports: NewebCommon,
        });
    }
    public async preloadModules(modules: IPackInfoModule[]) {
        await Promise.all(modules.map(async (mod) => {
            if (await this.hasModule(mod.type, mod.name, mod.version)) {
                return;
            }
            const response =
                await fetch(this.config.address + "/" + mod.type + "/"
                    + mod.name.replace(/\//gi, "~") + "/" + mod.version + ".js");
            if (response.status !== 200) {
                throw new Error("Invalid response::" + await response.text());
            }
            const content = await response.text();
            await this.addModule(mod.type, mod.name, mod.version, content);
        }));
    }
    public async hasModule(type: string, name: string, version?: string) {
        const mod = this.modules.find((m) => m.type === type && m.name === name && (!version || m.version === version));
        if (mod) {
            return true;
        }
        const content = localStorage.getItem(this.getModuleStorageName(type, name, version));
        if (content) {
            this.modules.push({
                content,
                name,
                type,
                version,
                exports: undefined,
            });
            return true;
        }
        return false;
    }
    public async addModule(type: string, name: string, version: string | undefined, content: string) {
        if (await this.hasModule(type, name, version)) {
            return;
        }
        this.modules.push({
            name,
            version,
            type,
            content,
            exports: undefined,
        });
        localStorage.setItem(this.getModuleStorageName(type, name, version), content);
    }
    public loadModule(type: string, name: string, version?: string) {
        /*
        const mod = this.modules.find((m) => m.type === type && m.name === name && (!version || m.version === version));
        if (!mod) {
            throw new Error("Not found module " + type + "::" + name + "::" + version);
        }
        const content = localStorage.getItem("__neweb_module_" + type + "~" + name + "~" + version);
        if (content) {
            this.addModule(type, name, version, content);
        }*/
        if (!this.hasModule(type, name, version)) {
            throw new Error("Not found module " + type + "::" + name + "::" + version);
        }
        const mod = this.modules.find((m) => m.type === type && m.name === name && (!version || m.version === version));
        if (!mod) {
            throw new Error("Not found module " + type + "::" + name + "::" + version);
        }
        if (typeof (mod.exports) === "undefined") {
            mod.exports = this.evalModule(mod.content);
        }
        return mod.exports;
    }
    protected evalModule(content: string) {
        (window as any)[REQUIRE_FUNC_NAME] = this.loadModule.bind(this);
        // tslint:disable-next-line:no-eval
        return eval(content);
    }
    protected getModuleStorageName(type: string, name: string, version?: string) {
        return "__neweb_module_" + type + "~" + name + "~" + version;
    }
}
export default ClientModulesManager;
