import { v4 as uuidv4 } from "uuid";

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({
            success: false,
            error: "Method Not Allowed"
        });
    }

    try {
        const sessionId = uuidv4();

        console.log("Session created", sessionId);

        return res.status(200).json({
            success: true,
            sessionId,
        });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Session creation failed" });
    }
}