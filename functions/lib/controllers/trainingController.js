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
exports.App = void 0;
const express_1 = __importDefault(require("express"));
const admin = __importStar(require("firebase-admin"));
const firebase_1 = require("../config/firebase");
const router = express_1.default.Router();
const COLLECTION = 'trainings';
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
router.post("/:id/register", async (req, res) => {
    try {
        const { studentId } = req.body;
        await firebase_1.db.collection(COLLECTION).doc(req.params.id).update({
            participants: admin.firestore.FieldValue.arrayUnion(studentId)
        });
        res.send("Registered");
    }
    catch (error) {
        res.status(500).send(error);
    }
});
exports.App = router;
//# sourceMappingURL=trainingController.js.map