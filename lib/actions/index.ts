import { IRegistryActions } from "./../..";
import { onNewFrameControllerData } from "./../controllers";
import { IGlobalStoreActionResolver } from "./../GlobalStore";
import { onHttpRequest } from "./../http";
import { navigateSeance, onNewRoute } from "./../seances";

// controller data emit
// router route emit
// socket event
// http request
type ActionsConfig = {[P in keyof IRegistryActions]: IGlobalStoreActionResolver<IRegistryActions, P>};
const actions: ActionsConfig = {
    "new-controller-data": {
        action: (store, params, args) => onNewFrameControllerData(store, params.frameId, args),
    },
    "new-http-request": {
        action: (store, _, args) => onHttpRequest(store, args.request, args.response),
    },
    "new-router-route": {
        action: (store, params, args) => onNewRoute(store, params.seanceId, args),
    },
    "new-socket-connection": {
        action: (store, params, args) => { },
    },
    "seance-navigate": {
        action: (store, params, args) => navigateSeance(store, params.seanceId, args),
    },
};
export default actions;
