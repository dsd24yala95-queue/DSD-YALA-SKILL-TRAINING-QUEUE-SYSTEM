import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseProfileJson } from "@/lib/jsonEngine";
import { checkStaffAuth } from "@/lib/auth-guard";

export async function GET() {
    try {
        const { errorResponse } = await checkStaffAuth();
        if (errorResponse) return errorResponse;

        const [users, queues] = await Promise.all([
            prisma.user.findMany({
                where: { role: "member" },
                select: { id: true, profileJson: true, createdAt: true }
            }),
            prisma.queueBooking.findMany({
                select: { id: true, status: true, bookingType: true, createdAt: true }
            })
        ]);

        // Province Mapping: 95: ยะลา, 94: ปัตตานี, 96: นราธิวาส, 90: สงขลา
        const provinceCounts: Record<string, number> = {
            "ยะลา": 0,
            "ปัตตานี": 0,
            "นราธิวาส": 0,
            "สงขลา": 0,
            "อื่นๆ": 0
        };

        const workStateCounts: Record<string, number> = {
            "ทำงานแล้ว": 0,
            "ว่างงาน": 0,
            "ไม่ระบุ": 0
        };

        const workSectionCounts: Record<string, number> = {
            "ภาคเอกชน": 0,
            "รัฐวิสาหกิจ": 0,
            "ภาครัฐ": 0,
            "อาชีพอิสระ": 0,
            "ว่างงาน/อื่นๆ": 0
        };

        const industryCounts: Record<string, number> = {};
        let wantJobCount = 0;
        let wantOverseasCount = 0;

        users.forEach(u => {
            const detail = parseProfileJson(u.profileJson, { createdAt: u.createdAt });
            
            // Province
            const provCode = detail.reg_address_province;
            if (provCode === "95") provinceCounts["ยะลา"]++;
            else if (provCode === "94") provinceCounts["ปัตตานี"]++;
            else if (provCode === "96") provinceCounts["นราธิวาส"]++;
            else if (provCode === "90") provinceCounts["สงขลา"]++;
            else provinceCounts["อื่นๆ"]++;

            // Work State
            if (detail.work_state === "1") {
                workStateCounts["ทำงานแล้ว"]++;
                if (detail.work_section === "1") workSectionCounts["ภาคเอกชน"]++;
                else if (detail.work_section === "2") workSectionCounts["รัฐวิสาหกิจ"]++;
                else if (detail.work_section === "3") workSectionCounts["ภาครัฐ"]++;
                else if (detail.work_section === "4") workSectionCounts["อาชีพอิสระ"]++;
                else workSectionCounts["ว่างงาน/อื่นๆ"]++;
            } else if (detail.work_state === "0") {
                workStateCounts["ว่างงาน"]++;
                workSectionCounts["ว่างงาน/อื่นๆ"]++;
            } else {
                workStateCounts["ไม่ระบุ"]++;
                workSectionCounts["ว่างงาน/อื่นๆ"]++;
            }

            // Industry
            const ind = detail.work_group || detail.industry_desc || "ยังไม่ระบุ";
            const indLabel = ind === "00" ? "ยังไม่ระบุ" : ind;
            industryCounts[indLabel] = (industryCounts[indLabel] || 0) + 1;

            // Find job & Overseas
            if (detail.info_findjob === "1") {
                wantJobCount++;
                if (detail.info_findjob_country && detail.info_findjob_country !== "") {
                    wantOverseasCount++;
                }
            }
        });

        // Queues Summary
        const queueStats = {
            total: queues.length,
            pending: queues.filter(q => q.status === "pending").length,
            confirmed: queues.filter(q => q.status === "confirmed" || q.status === "approved" || q.status === "appointed").length,
            completed: queues.filter(q => q.status === "completed" || q.status === "passed").length,
            cancelled: queues.filter(q => q.status === "cancelled" || q.status === "rejected").length,
            testCount: queues.filter(q => q.bookingType === "test").length,
            trainingCount: queues.filter(q => q.bookingType === "training").length,
        };

        return NextResponse.json({
            totalMembers: users.length,
            provinceCounts,
            workStateCounts,
            workSectionCounts,
            industryCounts,
            jobSeeking: {
                wantJob: wantJobCount,
                wantOverseas: wantOverseasCount
            },
            queueStats
        });
    } catch (error: any) {
        console.error("Error generating admin stats:", error);
        return NextResponse.json({ error: error.message || "Failed to fetch stats" }, { status: 500 });
    }
}
