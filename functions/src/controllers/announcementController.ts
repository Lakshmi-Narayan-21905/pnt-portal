import express from "express";
import { db } from "../config/firebase";

const router = express.Router();
const COLLECTION = 'announcements';

router.get("/", async (req, res) => {
    try {
        const snap = await db.collection(COLLECTION).orderBy('createdAt', 'desc').get();
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        res.json(data);
    } catch (error) { res.status(500).send(error); }
});

router.post("/", async (req, res) => {
    try {
        const ref = await db.collection(COLLECTION).add({
            ...req.body,
            createdAt: Date.now()
        });
        res.status(201).send(ref.id);
    } catch (error) { res.status(500).send(error); }
});

router.delete("/:id", async (req, res) => {
    try {
        await db.collection(COLLECTION).doc(req.params.id).delete();
        res.send("Deleted");
    } catch (error) { res.status(500).send(error); }
});

export const App = router;
