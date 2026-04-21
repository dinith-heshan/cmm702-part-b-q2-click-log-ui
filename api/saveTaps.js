import admin from "firebase-admin";

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
        return res.status(405).send("Method Not Allowed");
    }

    try {
        const { sessionId, platform, taps } = req.body;

        if (
            !sessionId || typeof sessionId !== "string" ||
            !platform || typeof platform !== "string" ||
            !Array.isArray(taps) || taps.length === 0
        ) {
            return res.status(400).send("Invalid input");
        }

        const batch = db.batch();

        for (const tap of taps) {
            if (
                typeof tap.startTimestamp !== "number" ||
                typeof tap.endTimestamp !== "number"
            ) {
                console.warn("Invalid tap ignored:", tap);
                continue;
            }

            const docRef = db.collection("tapLogs").doc();

            const tapDuration = tap.endTimestamp - tap.startTimestamp;

            batch.set(docRef, {
                sessionId: sessionId,
                platform: platform,

                tapSequenceNumber: tap.tapSequenceNumber,
                startTimestamp: tap.startTimestamp,
                endTimestamp: tap.endTimestamp,
                tapDuration: tapDuration,
                interfaceType: tap.interfaceType,

                serverTimestamp: admin.firestore.FieldValue.serverTimestamp(),
            });
        }

        await batch.commit();

        console.log("Batch committed successfully");

        return res.status(200).json({
            success: true,
            saved: taps.length
        });

    } catch (err) {
        console.error(err);
        return res.status(500).send("Server error");
    }
}