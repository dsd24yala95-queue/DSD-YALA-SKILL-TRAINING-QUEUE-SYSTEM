import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// ─── GET: สถิติ CSAT สำหรับ Admin Analytics ─────────────────────────────────
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const bookingId = searchParams.get("bookingId");

        // If bookingId provided — return specific survey
        if (bookingId) {
            const survey = await (prisma as any).csatSurvey.findUnique({
                where: { bookingId },
            });
            return NextResponse.json(survey || null);
        }

        // Otherwise return aggregated stats for Admin Analytics
        const [all, responded] = await Promise.all([
            (prisma as any).csatSurvey.findMany({
                orderBy: { sentAt: "desc" },
                take: 200,
            }),
            (prisma as any).csatSurvey.findMany({
                where: { status: "responded" },
                select: {
                    rating: true,
                    itemName: true,
                    bookingType: true,
                    respondedAt: true,
                    comment: true,
                },
                orderBy: { respondedAt: "desc" },
                take: 200,
            }),
        ]);

        const totalSent = all.length;
        const totalResponded = responded.length;
        const responseRate = totalSent > 0 ? Math.round((totalResponded / totalSent) * 100) : 0;
        const avgRating = totalResponded > 0
            ? +(responded.reduce((sum: number, s: any) => sum + (s.rating || 0), 0) / totalResponded).toFixed(2)
            : 0;

        // Star distribution
        const starDist: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        responded.forEach((s: any) => {
            if (s.rating >= 1 && s.rating <= 5) starDist[s.rating]++;
        });

        // Latest 10 comments
        const latestComments = responded
            .filter((s: any) => s.comment)
            .slice(0, 10)
            .map((s: any) => ({
                itemName: s.itemName,
                bookingType: s.bookingType,
                rating: s.rating,
                comment: s.comment,
                respondedAt: s.respondedAt,
            }));

        return NextResponse.json({
            totalSent,
            totalResponded,
            responseRate,
            avgRating,
            starDistribution: starDist,
            latestComments,
        });
    } catch (error: any) {
        console.error("CSAT GET Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// ─── POST: บันทึกคำตอบ CSAT จาก LINE Postback ───────────────────────────────
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { bookingId, rating, comment } = body;

        if (!bookingId || !rating || rating < 1 || rating > 5) {
            return NextResponse.json({ error: "bookingId and rating (1-5) are required" }, { status: 400 });
        }

        const updated = await (prisma as any).csatSurvey.update({
            where: { bookingId },
            data: {
                rating,
                comment: comment || null,
                respondedAt: new Date(),
                status: "responded",
            },
        });

        return NextResponse.json({ success: true, survey: updated });
    } catch (error: any) {
        console.error("CSAT POST Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
