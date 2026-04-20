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
        const body = req.body;

        // If sent as x-www-form-urlencoded string
        const params = new URLSearchParams(body);

        const sessionId = params.get("id");
        const platform = params.get("platform"); // ios / android / macos / windows
        const tapsRaw = params.get("taps");

        if (!sessionId || !platform || !tapsRaw) {
        return res.status(400).send("Missing fields");
        }

        // taps comes as stringified array
        const taps = JSON.parse("[" + tapsRaw + "]");

        const batch = db.batch();

        const serverTimestamp = admin.firestore.FieldValue.serverTimestamp();

        taps.forEach((tapStr) => {
        const tap = JSON.parse(tapStr);

        const docRef = db.collection("tap_logs").doc();

        if (
            typeof tap.startTimestamp !== "number" ||
            typeof tap.endTimestamp !== "number"
        ) continue;

        const duration = tap.endTimestamp - tap.startTimestamp;

        batch.set(docRef, {
            session_id: sessionId,
            platform: platform,
            interface_type: tap.interface,
            interface_sequence: tap.interfaceSequence,

            tap_sequence: tap.tapSequenceNumber,
            start_timestamp: tap.startTimestamp,
            end_timestamp: tap.endTimestamp,

            duration_ms: duration,

            created_at: serverTimestamp,
        });
        });

    await batch.commit();

    return res.status(200).send("Data saved successfully");
    } catch (err) {
        console.error(err);
        return res.status(500).send("Server error");
    }
}