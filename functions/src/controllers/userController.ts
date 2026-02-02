import express from "express";
import { db } from "../config/firebase";

const router = express.Router();

const ROLE_COLLECTIONS: Record<string, string> = {
    'ADMIN': 'admin',
    'PLACEMENT_HEAD': 'placement_heads',
    'TRAINING_HEAD': 'training_heads',
    'DEPT_COORDINATOR': 'dept_coordinators',
    'CLASS_COORDINATOR': 'class_coordinators',
    'STUDENT': 'students'
};

// Helper: Find user doc across collections
const findUserDoc = async (uid: string) => {
    const promises = Object.values(ROLE_COLLECTIONS).map(async (colName) => {
        const ref = db.collection(colName).doc(uid);
        const snap = await ref.get();
        return { ref, snap };
    });

    const results = await Promise.all(promises);
    return results.find(r => r.snap.exists);
};

// GET /profile/:uid
router.get("/profile/:uid", async (req, res) => {
    try {
        const { uid } = req.params;
        const result = await findUserDoc(uid);

        if (result && result.snap.exists) {
            res.json(result.snap.data());
        } else {
            res.status(404).send("User profile not found");
        }
    } catch (error) {
        console.error("Error fetching profile:", error);
        res.status(500).send("Internal Server Error");
    }
});

// POST /profile (Create)
router.post("/profile", async (req, res) => {
    try {
        const userProfile = req.body;
        const { uid, role } = userProfile;

        if (!uid || !role) {
            res.status(400).send("Missing UID or Role");
            return;
        }

        const collectionName = ROLE_COLLECTIONS[role];
        if (!collectionName) {
            res.status(400).send("Invalid Role");
            return;
        }

        await db.collection(collectionName).doc(uid).set(userProfile);
        res.status(201).send("Profile Created");
    } catch (error) {
        console.error("Error creating profile:", error);
        res.status(500).send("Internal Server Error");
    }
});

// PUT /profile/:uid (Update)
router.put("/profile/:uid", async (req, res) => {
    try {
        const { uid } = req.params;
        const data = req.body;

        const result = await findUserDoc(uid);
        if (result && result.ref) {
            await result.ref.update(data);
            res.send("Profile Updated");
        } else {
            res.status(404).send("User not found");
        }
    } catch (error) {
        console.error("Error updating profile:", error);
        res.status(500).send("Internal Server Error");
    }
});

// DELETE /profile/:uid
router.delete("/profile/:uid", async (req, res) => {
    try {
        const { uid } = req.params;
        const result = await findUserDoc(uid);

        if (result && result.ref) {
            await result.ref.delete();
            res.send("Profile Deleted");
        } else {
            res.status(404).send("User not found");
        }
    } catch (error) {
        console.error("Error deleting profile:", error);
        res.status(500).send("Internal Server Error");
    }
});

// GET /role/:role
router.get("/role/:role", async (req, res) => {
    try {
        const { role } = req.params;
        const collectionName = ROLE_COLLECTIONS[role];

        if (!collectionName) {
            res.status(400).send("Invalid Role");
            return;
        }

        const snapshot = await db.collection(collectionName).get();
        const users = snapshot.docs.map(doc => doc.data());
        res.json(users);
    } catch (error) {
        console.error("Error fetching users by role:", error);
        res.status(500).send("Internal Server Error");
    }
});

// GET /all
router.get("/all", async (req, res) => {
    try {
        const users: any[] = [];
        for (const colName of Object.values(ROLE_COLLECTIONS)) {
            const snap = await db.collection(colName).get();
            snap.forEach(doc => users.push(doc.data()));
        }
        res.json(users);
    } catch (error) {
        console.error("Error fetching all users:", error);
        res.status(500).send("Internal Server Error");
    }
});

// PUT /status/roll (Update Status by RollNo)
router.put("/status/roll", async (req, res) => {
    try {
        const { rollNo, status } = req.body;
        if (!rollNo || !status) {
            res.status(400).send("Missing rollNo or status");
            return;
        }

        const normalizedRoll = rollNo.toLowerCase().trim();
        const snapshot = await db.collection('students').where('rollNo', '==', normalizedRoll).get();

        if (!snapshot.empty) {
            const doc = snapshot.docs[0];
            await doc.ref.update({ placementStatus: status });
            res.json({ success: true, message: "Status Updated" });
        } else {
            // Return success false but 200 OK to match frontend expectation of non-throwing failure?
            // Or 404? Frontend service returned false.
            res.status(404).json({ success: false, message: "User not found" });
        }
    } catch (error) {
        console.error("Error updating status by roll:", error);
        res.status(500).send("Internal Server Error");
    }
});

export const App = router;
