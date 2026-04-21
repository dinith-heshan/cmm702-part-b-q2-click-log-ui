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

        if (!sessionId || !platform || !taps) {
        return res.status(400).send("Missing fields");
        }

        const batch = db.batch();

        for (const tap of taps) {
            const docRef = db.collection("tap_logs").doc();

            if (
                typeof tap.startTimestamp !== "number" ||
                typeof tap.endTimestamp !== "number"
            ) {
                console.warn("Invalid tap ignored:", tap);
                continue;
            }

            const tapDuration = tap.endTimestamp - tap.startTimestamp;

            batch.set(docRef, {
                session_id: sessionId,
                platform: platform,

                tap_sequence_number: tap.tapSequenceNumber,
                start_timestamp: tap.startTimestamp,
                end_timestamp: tap.endTimestamp,
                tap_duration: tapDuration,
                interface_type: tap.interfaceType,

                server_timestamp: admin.firestore.FieldValue.serverTimestamp(),
            });
        }

        await batch.commit();
        return res.status(200).send("Data saved successfully");

    } catch (err) {
        console.error(err);
        return res.status(500).send("Server error");
    }
}