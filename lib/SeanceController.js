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
const ControllersManager_1 = require("./ControllersManager");
class SeanceController {
    constructor(config) {
        this.config = config;
    }
    connect(socketId) {
        return __awaiter(this, void 0, void 0, function* () {
            const socket = yield this.config.store.getObject("socket", socketId);
            const seanceId = yield this.config.store.findId("seance-socket", (s) => s === socketId);
            const currentPage = yield this.config.store.get("seance-current-page", seanceId);
            const controllersManager = new ControllersManager_1.default({
                app: this.config.app,
                store: this.config.store,
            });
            yield Promise.all(currentPage.frames.map((frame) => __awaiter(this, void 0, void 0, function* () {
                socket.emit("frame-controller-data", {
                    frameId: frame.frameId,
                    data: yield controllersManager.getControllerData(frame.frameId),
                });
            })));
            socket.on("frame-controller-dispatch", (params, cb) => __awaiter(this, void 0, void 0, function* () {
                const controller = yield controllersManager.getController(params.frameId);
                if (controller) {
                    yield controller.dispatch(params.actionName, ...params.args);
                    cb();
                }
            }));
            socket.on("navigate", ({ url }) => __awaiter(this, void 0, void 0, function* () {
                yield this.navigate(seanceId, url);
            }));
        });
    }
}
exports.default = SeanceController;
