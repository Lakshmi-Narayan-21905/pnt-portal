import express from "express";
import * as admin from 'firebase-admin';

const router = express.Router();

// POST /create-user
router.post("/create-user", async (req, res) => {
    try {
        const { email, password, displayName, role } = req.body;

        if (!email || !password) {
            res.status(400).send("Missing email or password");
            return;
        }

        const userRecord = await admin.auth().createUser({
            email,
            password,
            displayName
        });

        if (role) {
            await admin.auth().setCustomUserClaims(userRecord.uid, { role });
        }

        res.status(201).json({ uid: userRecord.uid, email: userRecord.email });
    } catch (error) {
        console.error("Error creating user:", error);
        res.status(500).send("Error creating user");
    }
});

export const App = router;
