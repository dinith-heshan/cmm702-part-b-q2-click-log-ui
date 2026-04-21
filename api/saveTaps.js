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
        return res.status(405).json({
            success: false,
            error: "Method Not Allowed"
        });
    }

    try {
        const { sessionId, platform, interfaceSequence, interfaceType, taps } = req.body;

        if (
            !sessionId || typeof sessionId !== "string" ||
            !platform || typeof platform !== "string" ||
            !Number.isInteger(interfaceSequence) ||
            !interfaceType || typeof interfaceType !== "string" ||
            !Array.isArray(taps) || taps.length === 0
        ) {
            return res.status(400).json({
                success: false,
                error: "Invalid input"
            });
        }

        const sessionData = {
            sessionId,
            platform,
            interfaceSequence,
            interfaceType,

            serverTimestamp: admin.firestore.FieldValue.serverTimestamp(),
        };

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
                sessionId,
                platform,
                interfaceType,

                tapSequenceNumber: tap.tapSequenceNumber,
                startTimestamp: tap.startTimestamp,
                endTimestamp: tap.endTimestamp,
                tapDuration: tapDuration
            });
        }

        await db.collection("sessions").doc(sessionId).set(sessionData);
        await batch.commit();

        console.log("Batch committed successfully");

        return res.status(200).json({
            success: true,
            saved: taps.length
        });

    } catch (err) {
        console.error(err);
        return res.status(500).json({
            success: false,
            error: "Server error"
        });
    }
}