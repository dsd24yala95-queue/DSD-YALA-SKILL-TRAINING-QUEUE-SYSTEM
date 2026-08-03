import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkStaffAuth } from "@/lib/auth-guard";

export async function GET() {
    try {
        const courses = await prisma.masterCourse.findMany({
            orderBy: { createdAt: "desc" }
        });
        return NextResponse.json(courses);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const { errorResponse } = await checkStaffAuth();
        if (errorResponse) return errorResponse;

        const body = await req.json();
        const {
            courseName,
            durationDays,
            maxSeats,
            LocationName,
            LocationGPS,
            Date: courseDate,
            DateEnd,
            status,
        } = body;

        // Validation
        if (!courseName || typeof courseName !== "string" || !courseName.trim()) {
            return NextResponse.json({ error: "กรุณาระบุชื่อหลักสูตรให้ถูกต้อง" }, { status: 400 });
        }

        const parsedDuration = parseInt(String(durationDays || 1), 10);
        const parsedMaxSeats = parseInt(String(maxSeats || 30), 10);

        if (isNaN(parsedDuration) || parsedDuration <= 0) {
            return NextResponse.json({ error: "ระยะเวลา (วัน) ต้องเป็นตัวเลขอันดับบวก" }, { status: 400 });
        }
        if (isNaN(parsedMaxSeats) || parsedMaxSeats <= 0) {
            return NextResponse.json({ error: "จำนวนที่รับ (คน) ต้องเป็นตัวเลขอันดับบวก" }, { status: 400 });
        }

        const course = await prisma.masterCourse.create({
            data: {
                courseName: courseName.trim(),
                durationDays: parsedDuration,
                maxSeats: parsedMaxSeats,
                LocationName: LocationName ? String(LocationName).trim() : null,
                LocationGPS: LocationGPS ? String(LocationGPS).trim() : null,
                Date: courseDate ? String(courseDate).trim() : null,
                DateEnd: DateEnd ? String(DateEnd).trim() : null,
                status: status === "inactive" ? "inactive" : "active",
            }
        });
        return NextResponse.json(course, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    try {
        const { errorResponse } = await checkStaffAuth();
        if (errorResponse) return errorResponse;

        const body = await req.json();
        const {
            id,
            courseName,
            durationDays,
            maxSeats,
            LocationName,
            LocationGPS,
            Date: courseDate,
            DateEnd,
            status,
        } = body;

        if (!id || typeof id !== "string") {
            return NextResponse.json({ error: "Missing or invalid course ID" }, { status: 400 });
        }

        const updateData: any = {};
        if (courseName !== undefined) {
            if (typeof courseName !== "string" || !courseName.trim()) {
                return NextResponse.json({ error: "ชื่อหลักสูตรไม่ถูกต้อง" }, { status: 400 });
            }
            updateData.courseName = courseName.trim();
        }
        if (durationDays !== undefined) {
            const parsedDuration = parseInt(String(durationDays), 10);
            if (isNaN(parsedDuration) || parsedDuration <= 0) {
                return NextResponse.json({ error: "ระยะเวลา (วัน) ต้องเป็นตัวเลขอันดับบวก" }, { status: 400 });
            }
            updateData.durationDays = parsedDuration;
        }
        if (maxSeats !== undefined) {
            const parsedMaxSeats = parseInt(String(maxSeats), 10);
            if (isNaN(parsedMaxSeats) || parsedMaxSeats <= 0) {
                return NextResponse.json({ error: "จำนวนที่รับ (คน) ต้องเป็นตัวเลขอันดับบวก" }, { status: 400 });
            }
            updateData.maxSeats = parsedMaxSeats;
        }
        if (LocationName !== undefined) updateData.LocationName = LocationName ? String(LocationName).trim() : null;
        if (LocationGPS !== undefined) updateData.LocationGPS = LocationGPS ? String(LocationGPS).trim() : null;
        if (courseDate !== undefined) updateData.Date = courseDate ? String(courseDate).trim() : null;
        if (DateEnd !== undefined) updateData.DateEnd = DateEnd ? String(DateEnd).trim() : null;
        if (status !== undefined) updateData.status = status === "inactive" ? "inactive" : "active";

        const course = await prisma.masterCourse.update({
            where: { id },
            data: updateData
        });
        return NextResponse.json(course);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const { errorResponse } = await checkStaffAuth();
        if (errorResponse) return errorResponse;

        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");
        if (!id) return NextResponse.json({ error: "Missing course id" }, { status: 400 });
        await prisma.masterCourse.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
