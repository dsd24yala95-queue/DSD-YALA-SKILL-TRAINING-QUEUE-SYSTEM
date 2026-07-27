import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        // 1. นับคนที่มาจองทั้งหมด
        const totalBookings = await prisma.queueBooking.count();

        // 2. ผู้ผ่านการทดสอบ (สถานะ completed)
        const completedTests = await prisma.queueBooking.count({
            where: {
                bookingType: "test",
                status: "completed"
            }
        });

        // 3. นับจำนวน Course ที่เปิดจริง
        const activeCourses = await prisma.masterCourse.count({
            where: {
                status: "active"
            }
        });

        // 4. นับจำนวนสมาชิกทั้งหมดในระบบ
        const totalMembers = await prisma.user.count({
            where: {
                role: "member"
            }
        });

        return NextResponse.json({
            totalBookings,
            completedTests,
            activeCourses,
            totalMembers
        });
    } catch (error: any) {
        console.error("Failed to fetch system stats:", error);
        return NextResponse.json({
            totalBookings: 0,
            completedTests: 0,
            activeCourses: 0,
            totalMembers: 0
        }, { status: 500 });
    }
}
