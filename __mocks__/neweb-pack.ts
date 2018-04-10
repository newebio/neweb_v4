import { IPackInfo } from "neweb-pack";
export const page1RootFrame: IPackInfo = {
    name: "frames/page1RootFrame/view",
    version: "0.0.5",
    modules: [],
    type: "local",
};
export class ModulePacker {
    public async addLocalPackage(entry: string): Promise<IPackInfo> {
        if (entry.indexOf("page1RootFrame") > -1) {
            return page1RootFrame;
        }
        throw new Error("Unknown entry " + entry);
    }
}
