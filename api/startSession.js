import admin from "firebase-admin";
import { v4 as uuidv4 } from "uuid";

// Initialize Firebase Admin once
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(
            JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
        ),
    });
}

const db = admin.firestore();

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method Not Allowed" });
    }

    try {
        const { platform } = req.body;

        const sessionId = uuidv4();

        const sessionData = {
            platform,
            created: admin.firestore.FieldValue.serverTimestamp(),
        };

        await db.collection("sessions").doc(sessionId).set(sessionData);

        console.log("Session started.")

        return res.status(200).json({
            success: true,
            sessionId,
        });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Session creation failed" });
    }
}