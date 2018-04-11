import { IPackInfo } from "neweb-pack";
export const page1RootFrame: IPackInfo = {
    name: "frames/page1RootFrame/view",
    version: "0.0.5",
    modules: [],
    type: "local",
};
export const counterFrame: IPackInfo = {
    name: "frames/counter/view",
    version: "0.0.6",
    modules: [],
    type: "local",
};
export class ModulePacker {
    public async addLocalPackage(entry: string): Promise<IPackInfo> {
        if (entry.indexOf("page1RootFrame") > -1) {
            return page1RootFrame;
        }
        if (entry.indexOf("counter") > -1) {
            return counterFrame;
        }
        throw new Error("Unknown entry " + entry);
    }
}
