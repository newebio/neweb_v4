import { exists, readFile } from "fs";
import { IPackInfo, ModulePacker } from "neweb-pack";
import { join, resolve } from "path";
import { promisify } from "util";
import { INITIAL_VAR } from "../common";
import { IApplication, IPageMetaInfo, IRouter } from "../typings";
import FrameController from "./FrameController";
import FramesBasedRouter from "./FramesBasedRouter";
export interface IApplicationConfig {
    environment: "production" | "development";
    appPath: string;
    modulePacker: ModulePacker;
}
class Application implements IApplication {
    protected router: IRouter;
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
    public async getRouter(): Promise<IRouter> {
        if (this.environment === "production" && this.router) {
            return this.router;
        }
        const routerConfig = {
            app: this,
            config: await this.getConfig(),
            context: await this.getContext(),
        };
        try {
            const routerPath = require.resolve(join(this.appPath, "Router"));
            if (this.environment === "development") {
                delete require.cache[routerPath];
            }
            const RouterClass = require(routerPath).default;
            this.router = new RouterClass(routerConfig);
        } catch (e) {
            if (!this.router) {
                this.router = new FramesBasedRouter(routerConfig);
            }
        }
        return this.router;
    }
    public async hasFrame(frameName: string) {
        return promisify(exists)(resolve(this.appPath, "frames", frameName));
    }
    public async getContext() {
        if (typeof (this.context) !== "undefined") {
            return this.context;
        }
        try {
            const ContextClass = require(join(this.appPath, "Context")).default;
            this.context = new ContextClass({
                config: await this.getConfig(),
            });
        } catch (e) {
            this.context = {};
        }
        return this.context;
    }
    public async getConfig() {
        if (typeof (this.config) !== "undefined") {
            return this.config;
        }
        try {
            const ConfigClass = require(join(this.appPath, "Config." + this.environment)).default;
            this.config = new ConfigClass();
        } catch (e) {
            this.config = {};
        }
        return this.config;
    }
    public async getFrameControllerClass(frameName: string) {
        try {
            const path = join(this.appPath, "frames", frameName, "controller");
            if (this.environment === "development") {
                delete require.cache[path];
            }
            return require(path).default;
        } catch (e) {
            console.log(e, e.stack);
            return FrameController;
        }
    }
    public async getFrameViewClass(frameName: string) {
        try {
            return require(join(this.appPath, "frames", frameName, "view")).default;
        } catch (e) {
            return () => null;
        }
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
            .replace("{%script%}", `
            window["${INITIAL_VAR}"]=${JSON.stringify(initialInfo)}
            `);
    }
}
export default Application;
