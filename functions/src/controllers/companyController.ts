import express from "express";
import * as admin from "firebase-admin";
import { db } from "../config/firebase";

const router = express.Router();
const COLLECTION = "companies";

// GET / (Get all)
router.get("/", async (req, res) => {
    try {
        const snap = await db.collection(COLLECTION).get();
        const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.json(data);
    } catch (error) {
        console.error("Error fetching companies:", error);
        res.status(500).send("Internal Server Error");
    }
});

// GET /:id (Get one)
router.get("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const doc = await db.collection(COLLECTION).doc(id).get();
        if (doc.exists) {
            res.json({ id: doc.id, ...doc.data() });
        } else {
            res.status(404).send("Company not found");
        }
    } catch (error) {
        console.error("Error fetching company:", error);
        res.status(500).send("Internal Server Error");
    }
});

// POST / (Add)
router.post("/", async (req, res) => {
    try {
        const data = req.body;
        const ref = await db.collection(COLLECTION).add({
            ...data,
            applicants: [] // Init empty
        });

        // Note: Automated announcement logic should ideally be triggered by a Firestore Trigger
        // configured on the backend, rather than inline here, to keep response fast.

        res.status(201).send(ref.id);
    } catch (error) {
        console.error("Error adding company:", error);
        res.status(500).send("Internal Server Error");
    }
});

// PUT /:id (Update)
router.put("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        await db.collection(COLLECTION).doc(id).update(updates);
        res.send("Updated");
    } catch (error) {
        console.error("Error updating company:", error);
        res.status(500).send("Internal Server Error");
    }
});

// DELETE /:id (Delete)
router.delete("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        await db.collection(COLLECTION).doc(id).delete();
        res.send("Deleted");
    } catch (error) {
        console.error("Error deleting company:", error);
        res.status(500).send("Internal Server Error");
    }
});

// POST /:id/apply
router.post("/:id/apply", async (req, res) => {
    try {
        const { id } = req.params;
        const { studentId } = req.body;

        await db.collection(COLLECTION).doc(id).update({
            applicants: admin.firestore.FieldValue.arrayUnion(studentId)
        });
        res.send("Applied");
    } catch (error) {
        console.error("Error submitting application:", error);
        res.status(500).send("Internal Server Error");
    }
});

// POST /:id/optout
router.post("/:id/optout", async (req, res) => {
    try {
        const { id } = req.params;
        const { studentId } = req.body;

        await db.collection(COLLECTION).doc(id).update({
            optedOut: admin.firestore.FieldValue.arrayUnion(studentId)
        });
        res.send("Opted Out");
    } catch (error) {
        console.error("Error opting out:", error);
        res.status(500).send("Internal Server Error");
    }
});

export const App = router;
