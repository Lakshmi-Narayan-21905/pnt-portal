"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.App = void 0;
const express_1 = __importDefault(require("express"));
const firebase_1 = require("../config/firebase");
const router = express_1.default.Router();
const COLLECTION = 'placement_records';
router.get("/", async (req, res) => {
    try {
        const snap = await firebase_1.db.collection(COLLECTION).get();
        const data = snap.docs.map(d => (Object.assign({ id: d.id }, d.data())));
        res.json(data);
    }
    catch (error) {
        res.status(500).send(error);
    }
});
router.get("/:id", async (req, res) => {
    try {
        const doc = await firebase_1.db.collection(COLLECTION).doc(req.params.id).get();
        if (doc.exists)
            res.json(Object.assign({ id: doc.id }, doc.data()));
        else
            res.status(404).send("Not Found");
    }
    catch (error) {
        res.status(500).send(error);
    }
});
router.post("/", async (req, res) => {
    try {
        const ref = await firebase_1.db.collection(COLLECTION).add(req.body);
        res.status(201).send(ref.id);
    }
    catch (error) {
        res.status(500).send(error);
    }
});
router.put("/:id", async (req, res) => {
    try {
        await firebase_1.db.collection(COLLECTION).doc(req.params.id).update(req.body);
        res.send("Updated");
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
//# sourceMappingURL=placementController.js.map