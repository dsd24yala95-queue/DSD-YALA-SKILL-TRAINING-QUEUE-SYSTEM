import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const count = await prisma.queueBooking.count({
            where: { 
                status: "checked_in",
                bookingDate: {
                    gte: today,
                    lt: tomorrow
                }
            }
        });

        // Get custom wait time from setting, default to 15 if not set
        const waitTimeSetting = await prisma.systemSetting.findUnique({
            where: { key: "liveWaitTime" }
        });

        let waitTime = 15; // default
        if (waitTimeSetting) {
            waitTime = parseInt(waitTimeSetting.value, 10) || 15;
        }

        return NextResponse.json({ count, waitTime: count * waitTime });
    } catch (error: any) {
        return NextResponse.json({ count: 0, waitTime: 0 });
    }
}
