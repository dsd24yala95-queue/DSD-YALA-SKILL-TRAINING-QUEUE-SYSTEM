import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkStaffAuth } from "@/lib/auth-guard";

export async function GET() {
    try {
        const branches = await prisma.masterBranch.findMany({
            orderBy: { createdAt: "desc" }
        });

        // Compute real-time currentQueue count for each branch from active bookings
        const branchesWithCount = await Promise.all(
            branches.map(async (b) => {
                const count = await prisma.queueBooking.count({
                    where: {
                        bookingType: "test",
                        status: { not: "cancelled" },
                        OR: [
                            { itemId: b.id },
                            { itemName: { equals: b.branchName, mode: "insensitive" } }
                        ]
                    }
                });
                return {
                    ...b,
                    currentQueue: count
                };
            })
        );

        return NextResponse.json(branchesWithCount);
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
            branchName,
            levels,
            maxQueue,
            LocationName,
            LocationGPS,
            Date: branchDate,
            DateEnd,
            status,
        } = body;

        if (!branchName || typeof branchName !== "string" || !branchName.trim()) {
            return NextResponse.json({ error: "กรุณาระบุชื่อสาขาทดสอบให้ถูกต้อง" }, { status: 400 });
        }

        const parsedMaxQueue = parseInt(String(maxQueue || 50), 10);
        if (isNaN(parsedMaxQueue) || parsedMaxQueue <= 0) {
            return NextResponse.json({ error: "จำนวนคิวสูงสุดต่อวันต้องเป็นตัวเลขอันดับบวก" }, { status: 400 });
        }

        const branch = await prisma.masterBranch.create({
            data: {
                branchName: branchName.trim(),
                levels: levels ? String(levels).trim() : "ระดับ 1",
                maxQueue: parsedMaxQueue,
                LocationName: LocationName ? String(LocationName).trim() : null,
                LocationGPS: LocationGPS ? String(LocationGPS).trim() : null,
                Date: branchDate ? String(branchDate).trim() : null,
                DateEnd: DateEnd ? String(DateEnd).trim() : null,
                status: status === "inactive" ? "inactive" : "active",
            }
        });
        return NextResponse.json(branch, { status: 201 });
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
            branchName,
            levels,
            maxQueue,
            LocationName,
            LocationGPS,
            Date: branchDate,
            DateEnd,
            status,
        } = body;

        if (!id || typeof id !== "string") {
            return NextResponse.json({ error: "Missing or invalid branch ID" }, { status: 400 });
        }

        const updateData: any = {};
        if (branchName !== undefined) {
            if (typeof branchName !== "string" || !branchName.trim()) {
                return NextResponse.json({ error: "ชื่อสาขาทดสอบไม่ถูกต้อง" }, { status: 400 });
            }
            updateData.branchName = branchName.trim();
        }
        if (levels !== undefined) updateData.levels = levels ? String(levels).trim() : "ระดับ 1";
        if (maxQueue !== undefined) {
            const parsedMaxQueue = parseInt(String(maxQueue), 10);
            if (isNaN(parsedMaxQueue) || parsedMaxQueue <= 0) {
                return NextResponse.json({ error: "จำนวนคิวสูงสุดต่อวันต้องเป็นตัวเลขอันดับบวก" }, { status: 400 });
            }
            updateData.maxQueue = parsedMaxQueue;
        }
        if (LocationName !== undefined) updateData.LocationName = LocationName ? String(LocationName).trim() : null;
        if (LocationGPS !== undefined) updateData.LocationGPS = LocationGPS ? String(LocationGPS).trim() : null;
        if (branchDate !== undefined) updateData.Date = branchDate ? String(branchDate).trim() : null;
        if (DateEnd !== undefined) updateData.DateEnd = DateEnd ? String(DateEnd).trim() : null;
        if (status !== undefined) updateData.status = status === "inactive" ? "inactive" : "active";

        const branch = await prisma.masterBranch.update({
            where: { id },
            data: updateData
        });
        return NextResponse.json(branch);
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
        if (!id) return NextResponse.json({ error: "Missing branch id" }, { status: 400 });
        await prisma.masterBranch.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
