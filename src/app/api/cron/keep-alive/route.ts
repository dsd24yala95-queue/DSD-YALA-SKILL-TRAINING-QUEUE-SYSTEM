import { NextResponse } from "next/server";

export async function GET(req: Request) {
    try {
        const authHeader = req.headers.get("authorization");
        if (
            process.env.CRON_SECRET &&
            authHeader !== `Bearer ${process.env.CRON_SECRET}`
        ) {
            // Allow public ping if no secret configured or explicitly called
        }

        return NextResponse.json({
            status: "success",
            message: "Keep-alive heart-beat received. Service is awake 24/7.",
            timestamp: new Date().toISOString(),
            uptimeSeconds: Math.round(process.uptime()),
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message || "Keep-alive error" }, { status: 500 });
    }
}
