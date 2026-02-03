"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.api = void 0;
const functions = __importStar(require("firebase-functions"));
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const authMiddleware_1 = require("./middleware/authMiddleware");
const userController_1 = require("./controllers/userController");
const companyController_1 = require("./controllers/companyController");
const authController_1 = require("./controllers/authController");
const trainingController_1 = require("./controllers/trainingController");
const placementController_1 = require("./controllers/placementController");
const announcementController_1 = require("./controllers/announcementController");
// Initialize Express App
const app = (0, express_1.default)();
app.use((0, cors_1.default)({ origin: true }));
app.use(authMiddleware_1.validateFirebaseIdToken);
// Routes
app.use("/users", userController_1.App);
app.use("/companies", companyController_1.App);
app.use("/auth", authController_1.App);
app.use("/trainings", trainingController_1.App);
app.use("/placements", placementController_1.App);
app.use("/announcements", announcementController_1.App);
// Export the API
exports.api = functions.https.onRequest(app);
//# sourceMappingURL=index.js.map