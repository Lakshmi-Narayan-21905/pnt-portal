import express from "express";
import * as admin from "firebase-admin";
import { db } from "../config/firebase";

const router = express.Router();
const COLLECTION = 'trainings';

router.get("/", async (req, res) => {
    try {
        const snap = await db.collection(COLLECTION).get();
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        res.json(data);
    } catch (error) { res.status(500).send(error); }
});

router.get("/:id", async (req, res) => {
    try {
        const doc = await db.collection(COLLECTION).doc(req.params.id).get();
        if (doc.exists) res.json({ id: doc.id, ...doc.data() });
        else res.status(404).send("Not Found");
    } catch (error) { res.status(500).send(error); }
});

router.post("/", async (req, res) => {
    try {
        const ref = await db.collection(COLLECTION).add(req.body);
        res.status(201).send(ref.id);
    } catch (error) { res.status(500).send(error); }
});

router.put("/:id", async (req, res) => {
    try {
        await db.collection(COLLECTION).doc(req.params.id).update(req.body);
        res.send("Updated");
    } catch (error) { res.status(500).send(error); }
});

router.delete("/:id", async (req, res) => {
    try {
        await db.collection(COLLECTION).doc(req.params.id).delete();
        res.send("Deleted");
    } catch (error) { res.status(500).send(error); }
});

router.post("/:id/register", async (req, res) => {
    try {
        const { studentId } = req.body;
        await db.collection(COLLECTION).doc(req.params.id).update({
            participants: admin.firestore.FieldValue.arrayUnion(studentId)
        });
        res.send("Registered");
    } catch (error) { res.status(500).send(error); }
});

export const App = router;
