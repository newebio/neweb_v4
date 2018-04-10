import { NewebGlobalStore } from "./../..";
import { createSeance, loadSeancePage } from "./../seances";
import { getSessionContext, resolveSessionIdByRequest } from "./../sessions";

export async function httpRequest(store: NewebGlobalStore, requestId: string) {
    const request = await store.getObject("request", requestId);
    // get session's context
    const sessionId = await resolveSessionIdByRequest(store, request);
    const sesionContext = await getSessionContext(store, sessionId);
    const app = await store.getObject("app", "default");
    // get current route
    const RouterClass = await app.getRouterClass();
    const router = new RouterClass({
        context: await app.getContext(),
        session: sesionContext,
        request,
    });
    router.navigate({ request });
    const route = await router.waitRoute();
    router.dispose();
    // Handling route
    const res = await store.getObject("http-response", requestId);
    // Handling route
    if (route.type === "redirect") {
        res.header("location", route.url);
        res.sendStatus(302);
        return;
    }
    if (route.type === "notFound") {
        res.status(404).send(route.text);
        return;
    }
    // create new seans with RoutePage
    const seanceId = await createSeance(store, { sessionId, request });
    await loadSeancePage(store, seanceId, route.page);
}
