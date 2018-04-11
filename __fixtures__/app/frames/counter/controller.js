"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const __1 = require("../../../..");
class CounterController extends __1.FrameController {
    onInit() {
        CounterController.instance = this;
    }
    getInitialData() {
        return 0;
    }
}
exports.default = CounterController;
