import Router from "../testutil/Router";

class Application {
    public async getRouterClass() {
        return Router;
    }
    public async getContext() {
        return {
            appContext1: "appContext1Value",
        };
    }
}
export default Application;
