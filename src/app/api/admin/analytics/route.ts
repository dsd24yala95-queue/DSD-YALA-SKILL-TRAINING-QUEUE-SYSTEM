import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        // 1. Total counts and status breakdown
        const totalBookings = await prisma.queueBooking.count();
        const completedBookings = await prisma.queueBooking.count({ where: { status: "completed" } });
        const approvedBookings = await prisma.queueBooking.count({ where: { status: "approved" } });
        const pendingBookings = await prisma.queueBooking.count({ where: { status: "pending" } });
        const cancelledBookings = await prisma.queueBooking.count({ where: { status: "cancelled" } });

        const completionRate = totalBookings > 0 ? Math.round((completedBookings / totalBookings) * 100) : 0;

        // 2. Average wait time calculation (minutes between bookingDate and appointedDate/updatedAt)
        const completedQueueItems = await prisma.queueBooking.findMany({
            where: { status: "completed" },
            select: { bookingDate: true, appointedDate: true, updatedAt: true, createdAt: true },
        });

        let totalWaitMinutes = 0;
        let countWithTime = 0;

        completedQueueItems.forEach((item) => {
            const start = new Date(item.bookingDate || item.createdAt).getTime();
            const end = item.appointedDate ? new Date(item.appointedDate).getTime() : new Date(item.updatedAt).getTime();
            const diffMin = Math.max(5, Math.round((end - start) / (1000 * 60)));
            if (diffMin > 0 && diffMin < 10080) { // cap at 7 days for realistic average
                totalWaitMinutes += diffMin;
                countWithTime++;
            }
        });

        const avgWaitMinutes = countWithTime > 0 ? Math.round(totalWaitMinutes / countWithTime) : 25;
        const avgServiceMinutes = 20; // Avg 20 mins per service

        // 3. Category comparison: Training vs Testing
        const trainingBookings = await prisma.queueBooking.count({ where: { bookingType: "training" } });
        const testingBookings = await prisma.queueBooking.count({ where: { bookingType: "test" } });

        // 4. Popular Items Ranking (Top 5 Courses / Branches)
        const allBookings = await prisma.queueBooking.findMany({
            select: { itemName: true, bookingType: true },
        });

        const itemCounts: Record<string, { name: string; count: number; type: string }> = {};
        allBookings.forEach((b) => {
            if (!itemCounts[b.itemName]) {
                itemCounts[b.itemName] = { name: b.itemName, count: 0, type: b.bookingType };
            }
            itemCounts[b.itemName].count += 1;
        });

        const topPopularItems = Object.values(itemCounts)
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        // 5. Geographical breakdown by Yala Districts (อำเภอ)
        const allUsers = await prisma.user.findMany({
            where: { role: "member" },
            select: { profileJson: true },
        });

        const yalaDistricts: Record<string, number> = {
            "เมืองยะลา": 0,
            "เบตง": 0,
            "รามัน": 0,
            "ยะหา": 0,
            "บันนังสตา": 0,
            "กาบัง": 0,
            "ธารโต": 0,
            "กรงปินัง": 0,
            "อื่นๆ / นอกพื้นที่": 0,
        };

        allUsers.forEach((u) => {
            if (!u.profileJson) {
                yalaDistricts["เมืองยะลา"] += 1; // Default
                return;
            }

            try {
                const j = JSON.parse(u.profileJson);
                const addressText = `${j.amphoe || ""} ${j.district || ""} ${j.address || ""} ${j.province || ""}`;
                let matched = false;

                if (addressText.includes("เบตง")) { yalaDistricts["เบตง"] += 1; matched = true; }
                else if (addressText.includes("รามัน")) { yalaDistricts["รามัน"] += 1; matched = true; }
                else if (addressText.includes("ยะหา")) { yalaDistricts["ยะหา"] += 1; matched = true; }
                else if (addressText.includes("บันนังสตา")) { yalaDistricts["บันนังสตา"] += 1; matched = true; }
                else if (addressText.includes("กาบัง")) { yalaDistricts["กาบัง"] += 1; matched = true; }
                else if (addressText.includes("ธารโต")) { yalaDistricts["ธารโต"] += 1; matched = true; }
                else if (addressText.includes("กรงปินัง")) { yalaDistricts["กรงปินัง"] += 1; matched = true; }
                else if (addressText.includes("เมือง")) { yalaDistricts["เมืองยะลา"] += 1; matched = true; }

                if (!matched) {
                    yalaDistricts["เมืองยะลา"] += 1;
                }
            } catch {
                yalaDistricts["เมืองยะลา"] += 1;
            }
        });

        // 6. Day of Week distribution (Peak Days)
        const dayOfWeekCounts = [0, 0, 0, 0, 0, 0, 0]; // Sun - Sat
        const dayNames = ["อาทิตย์", "จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์", "เสาร์"];

        const queueDates = await prisma.queueBooking.findMany({
            select: { bookingDate: true, createdAt: true },
        });

        queueDates.forEach((q) => {
            const d = new Date(q.bookingDate || q.createdAt);
            dayOfWeekCounts[d.getDay()] += 1;
        });

        const dayOfWeekData = dayNames.map((name, idx) => ({
            day: name,
            count: dayOfWeekCounts[idx],
        }));

        // 7. Hourly Peak Distribution (08:00 - 16:00)
        const hourlyCounts: Record<string, number> = {
            "08:00": 0, "09:00": 0, "10:00": 0, "11:00": 0,
            "13:00": 0, "14:00": 0, "15:00": 0, "16:00": 0,
        };

        queueDates.forEach((q) => {
            const h = new Date(q.bookingDate || q.createdAt).getHours();
            const hStr = `${h.toString().padStart(2, "0")}:00`;
            if (hourlyCounts[hStr] !== undefined) {
                hourlyCounts[hStr] += 1;
            } else {
                hourlyCounts["09:00"] += 1; // Default cluster
            }
        });

        const hourlyData = Object.entries(hourlyCounts).map(([hour, count]) => ({
            hour,
            count,
        }));

        return NextResponse.json({
            kpis: {
                totalBookings,
                completedBookings,
                approvedBookings,
                pendingBookings,
                cancelledBookings,
                completionRate,
                avgWaitMinutes,
                avgServiceMinutes,
            },
            categories: {
                training: trainingBookings,
                testing: testingBookings,
            },
            topPopularItems,
            yalaDistricts: Object.entries(yalaDistricts).map(([district, count]) => ({ district, count })),
            dayOfWeekData,
            hourlyData,
        });
    } catch (error: any) {
        console.error("Analytics GET Error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
