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
const COLLECTION = "companies";
// GET / (Get all)
router.get("/", async (req, res) => {
    try {
        const snap = await firebase_1.db.collection(COLLECTION).get();
        const data = snap.docs.map(doc => (Object.assign({ id: doc.id }, doc.data())));
        res.json(data);
    }
    catch (error) {
        console.error("Error fetching companies:", error);
        res.status(500).send("Internal Server Error");
    }
});
// GET /:id (Get one)
router.get("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const doc = await firebase_1.db.collection(COLLECTION).doc(id).get();
        if (doc.exists) {
            res.json(Object.assign({ id: doc.id }, doc.data()));
        }
        else {
            res.status(404).send("Company not found");
        }
    }
    catch (error) {
        console.error("Error fetching company:", error);
        res.status(500).send("Internal Server Error");
    }
});
// POST / (Add)
router.post("/", async (req, res) => {
    try {
        const data = req.body;
        const ref = await firebase_1.db.collection(COLLECTION).add(Object.assign(Object.assign({}, data), { applicants: [] // Init empty
         }));
        // Note: Automated announcement logic should ideally be triggered by a Firestore Trigger
        // configured on the backend, rather than inline here, to keep response fast.
        res.status(201).send(ref.id);
    }
    catch (error) {
        console.error("Error adding company:", error);
        res.status(500).send("Internal Server Error");
    }
});
// PUT /:id (Update)
router.put("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        await firebase_1.db.collection(COLLECTION).doc(id).update(updates);
        res.send("Updated");
    }
    catch (error) {
        console.error("Error updating company:", error);
        res.status(500).send("Internal Server Error");
    }
});
// DELETE /:id (Delete)
router.delete("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        await firebase_1.db.collection(COLLECTION).doc(id).delete();
        res.send("Deleted");
    }
    catch (error) {
        console.error("Error deleting company:", error);
        res.status(500).send("Internal Server Error");
    }
});
// POST /:id/apply
router.post("/:id/apply", async (req, res) => {
    try {
        const { id } = req.params;
        const { studentId } = req.body;
        await firebase_1.db.collection(COLLECTION).doc(id).update({
            applicants: admin.firestore.FieldValue.arrayUnion(studentId)
        });
        res.send("Applied");
    }
    catch (error) {
        console.error("Error submitting application:", error);
        res.status(500).send("Internal Server Error");
    }
});
// POST /:id/optout
router.post("/:id/optout", async (req, res) => {
    try {
        const { id } = req.params;
        const { studentId } = req.body;
        await firebase_1.db.collection(COLLECTION).doc(id).update({
            optedOut: admin.firestore.FieldValue.arrayUnion(studentId)
        });
        res.send("Opted Out");
    }
    catch (error) {
        console.error("Error opting out:", error);
        res.status(500).send("Internal Server Error");
    }
});
exports.App = router;
//# sourceMappingURL=companyController.js.map