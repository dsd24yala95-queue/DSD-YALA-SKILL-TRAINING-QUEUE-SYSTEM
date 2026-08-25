import { NextResponse } from "next/server";

export async function GET() {
    return NextResponse.json(
        {
            status: "ok",
            service: "dsd-yala-skill-training-queue-system",
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
        },
        {
            headers: {
                "Cache-Control": "no-store, no-cache, must-revalidate",
            },
        }
    );
}
