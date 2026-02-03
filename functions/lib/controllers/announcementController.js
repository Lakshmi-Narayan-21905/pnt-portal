"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.App = void 0;
const express_1 = __importDefault(require("express"));
const firebase_1 = require("../config/firebase");
const router = express_1.default.Router();
const COLLECTION = 'announcements';
router.get("/", async (req, res) => {
    try {
        const snap = await firebase_1.db.collection(COLLECTION).orderBy('createdAt', 'desc').get();
        const data = snap.docs.map(d => (Object.assign({ id: d.id }, d.data())));
        res.json(data);
    }
    catch (error) {
        res.status(500).send(error);
    }
});
router.post("/", async (req, res) => {
    try {
        const ref = await firebase_1.db.collection(COLLECTION).add(Object.assign(Object.assign({}, req.body), { createdAt: Date.now() }));
        res.status(201).send(ref.id);
    }
    catch (error) {
        res.status(500).send(error);
    }
});
router.delete("/:id", async (req, res) => {
    try {
        await firebase_1.db.collection(COLLECTION).doc(req.params.id).delete();
        res.send("Deleted");
    }
    catch (error) {
        res.status(500).send(error);
    }
});
exports.App = router;
//# sourceMappingURL=announcementController.js.map