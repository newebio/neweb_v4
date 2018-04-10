import { exists, readFile } from "fs";
import { IPackInfo } from "neweb-pack";
import { join, resolve } from "path";
import { promisify } from "util";
import withError from "with-error";
import { INITIAL_VAR } from "../common";
import { IApplication, IPageMetaInfo, IRouterClass } from "../typings";
import ClassicRouter from "./ClassicRouter";
import FrameController from "./FrameController";

export interface IApplicationConfig {
    environment: "production" | "development";
    appPath: string;
    modulePacker: {
        addLocalPackage(path: string): Promise<IPackInfo>;
    };
}
class Application implements IApplication {
    protected template = `<!doctype><html>
    <head><title>{%title%}</title>{%meta%}
    <meta charset="utf8" /></head><body>
    <div id="root">{%html%}</div>
    <script>{%script%}</script>
    <script async src="/bundle.js"></script>
    </body></html>`;
    protected context: any;
    protected config: {};
    protected environment = "development";
    protected appPath: string;
    constructor(protected configuration: IApplicationConfig) {
        this.appPath = configuration.appPath;
        this.environment = configuration.environment;
    }
    public async requireModule(modulePath: string) {
        const { error, result: path } = withError(() => require.resolve(join(this.appPath, modulePath)));
        if (error) {
            return;
        }
        if (this.environment === "development") {
            delete require.cache[path];
        }
        return require(path).default;
    }
    public async getRouterClass(): Promise<IRouterClass> {
        return (await this.requireModule("Router")) || ClassicRouter;
    }
    public async hasFrame(frameName: string) {
        return promisify(exists)(resolve(this.appPath, "frames", frameName));
    }
    public async getContext() {
        if (typeof (this.context) !== "undefined") {
            return this.context;
        }
        const ContextClass = await this.requireModule("Context");
        this.context = ContextClass ? new ContextClass({
            config: await this.getConfig(),
        }) : {};
        return this.context;
    }
    public async getConfig() {
        if (typeof (this.config) !== "undefined") {
            return this.config;
        }
        const ConfigClass = await this.requireModule("Config." + this.environment);
        this.config = ConfigClass ? new ConfigClass() : {};
        return this.config;
    }
    public async getFrameControllerClass(frameName: string) {
        return (await this.requireModule("frames/" + frameName + "/controller")) || FrameController;
    }
    public async getFrameViewClass(frameName: string) {
        return (await this.requireModule("frames/" + frameName + "/view")) || (() => null);
    }
    public async getFrameViewModulePackInfo(frameName: string): Promise<IPackInfo> {
        return this.configuration.modulePacker.addLocalPackage(
            join(this.appPath, "frames", frameName, "view.js"),
        );
    }
    public async fillTemplate(html: string, meta: IPageMetaInfo, initialInfo: any) {
        const templatePath = join(this.appPath, "template.html");
        const template = await promisify(exists)(templatePath) ?
            (await promisify(readFile)(templatePath)).toString()
            : this.template;
        return template
            .replace("{%html%}", html)
            .replace("{%title%}", meta.title || "")
            .replace("{%meta%}", "<!--__page_meta_start__-->" + (meta.meta ? meta.meta.map((m) =>
                `<meta name="${m.name}" content="${m.content}" />`).join("") : "") + "<!--__page_meta_end__-->")
            .replace("{%script%}", `window["${INITIAL_VAR}"]=${JSON.stringify(initialInfo)}`);
    }
}
export default Application;
