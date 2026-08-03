import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { STAFF_ROLES } from "@/lib/auth-guard";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get("userId");

        let bookings;
        if (userId) {
            bookings = await prisma.queueBooking.findMany({
                where: { userId },
                orderBy: { createdAt: "desc" }
            });
        } else {
            bookings = await prisma.queueBooking.findMany({
                orderBy: { createdAt: "desc" }
            });
        }
        
        return NextResponse.json(bookings);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized — กรุณาเข้าสู่ระบบก่อนทำรายการจอง" }, { status: 401 });
        }

        const body = await req.json();
        const { userId, bookingType, itemId, itemName } = body;

        // Input validation
        if (!userId || typeof userId !== "string") {
            return NextResponse.json({ error: "กรุณาระบุ ID ผู้ใช้งาน" }, { status: 400 });
        }
        if (!bookingType || !["training", "test"].includes(bookingType)) {
            return NextResponse.json({ error: "ประเภทการจองต้องเป็น training หรือ test" }, { status: 400 });
        }
        if (!itemId || typeof itemId !== "string" || !itemName || typeof itemName !== "string") {
            return NextResponse.json({ error: "กรุณาระบุข้อมูลหลักสูตร/สาขาให้ครบถ้วน" }, { status: 400 });
        }

        const isStaff = STAFF_ROLES.includes(session.user.role);
        if (!isStaff && session.user.id !== userId) {
            return NextResponse.json({ error: "Forbidden — คุณสามารถจองคิวได้เฉพาะบัญชีของคุณเองเท่านั้น" }, { status: 403 });
        }

        // Use a Prisma transaction for Concurrency Safety
        const booking = await prisma.$transaction(async (tx) => {
            // 1. Check for duplicate active bookings for this specific item
            const activeBooking = await tx.queueBooking.findFirst({
                where: {
                    userId: userId,
                    itemId: itemId,
                    status: {
                        in: ["pending", "approved", "confirmed", "checked_in", "testing", "training"]
                    }
                }
            });

            if (activeBooking) {
                throw new Error("ไม่สามารถจองซ้ำได้ เนื่องจากคุณมีคิวที่กำลังรอดำเนินการสำหรับบริการนี้อยู่แล้ว");
            }

            // 2. Check Quota and lock the row
            let queueNumber = 1;

            if (bookingType === "training") {
                const course = await tx.masterCourse.findUnique({ where: { id: itemId } });
                if (!course) throw new Error("ไม่พบหลักสูตรนี้");
                if (course.currentQueue >= course.maxSeats) {
                    throw new Error("เต็มโควต้าแล้ว ไม่สามารถจองได้");
                }
                
                // Increment currentQueue
                const updatedCourse = await tx.masterCourse.update({
                    where: { id: itemId },
                    data: { currentQueue: { increment: 1 } }
                });
                queueNumber = updatedCourse.currentQueue;
                
            } else if (bookingType === "test") {
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                const count = await tx.queueBooking.count({
                    where: {
                        itemId: itemId,
                        bookingDate: { gte: today }
                    }
                });

                const branch = await tx.masterBranch.findUnique({ where: { id: itemId } });
                if (branch && count >= branch.maxQueue) {
                    throw new Error("คิวทดสอบของวันนี้เต็มแล้ว");
                }
                queueNumber = count + 1;
            }

            // 3. Create the booking record
            const newBooking = await tx.queueBooking.create({
                data: {
                    userId: userId,
                    bookingType: bookingType,
                    itemId: itemId,
                    itemName: itemName.trim(),
                    queueNumber: queueNumber,
                    status: "pending"
                },
                include: { user: true }
            });

            return newBooking;
        });

        // 4. Send LINE E-Ticket if user has linked LINE
        if (booking.user?.lineUserId && process.env.LINE_CHANNEL_ACCESS_TOKEN) {
            try {
                const url = "https://api.line.me/v2/bot/message/push";
                const headers = {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`
                };
                
                const flexMessage = {
                    type: "flex",
                    altText: "ตั๋วคิวอิเล็กทรอนิกส์ (E-Ticket)",
                    contents: {
                        type: "bubble",
                        header: {
                            type: "box",
                            layout: "vertical",
                            backgroundColor: "#10B981", // Emerald-500
                            contents: [
                                {
                                    type: "text",
                                    text: "DSD YALA E-TICKET",
                                    color: "#FFFFFF",
                                    weight: "bold",
                                    size: "xl",
                                    align: "center"
                                }
                            ]
                        },
                        body: {
                            type: "box",
                            layout: "vertical",
                            spacing: "md",
                            contents: [
                                {
                                    type: "text",
                                    text: `คิวหมายเลข: ${booking.queueNumber}`,
                                    weight: "bold",
                                    size: "xxl",
                                    color: "#047857",
                                    align: "center"
                                },
                                {
                                    type: "text",
                                    text: `คุณ ${booking.user.fullName || "ผู้เข้ารับบริการ"}`,
                                    size: "md",
                                    color: "#475569",
                                    align: "center"
                                },
                                {
                                    type: "text",
                                    text: `รายการ: ${booking.itemName}`,
                                    size: "sm",
                                    color: "#64748B",
                                    wrap: true,
                                    align: "center"
                                },
                                {
                                    type: "text",
                                    text: `กรุณารอรับการแจ้งเตือนเมื่อใกล้ถึงคิวของคุณ`,
                                    size: "xs",
                                    color: "#94A3B8",
                                    wrap: true,
                                    align: "center",
                                    margin: "lg"
                                }
                            ]
                        }
                    }
                };

                await fetch(url, { 
                    method: "POST", 
                    headers, 
                    body: JSON.stringify({
                        to: booking.user.lineUserId,
                        messages: [flexMessage]
                    })
                });
            } catch (e) {
                console.error("Failed to send LINE E-Ticket", e);
            }
        }

        return NextResponse.json(booking, { status: 201 });
    } catch (error: any) {
        if (error.message && (error.message.includes("ไม่สามารถ") || error.message.includes("เต็ม"))) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }
        return NextResponse.json({ error: error.message || "Failed to create booking" }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized — กรุณาเข้าสู่ระบบก่อนทำรายการ" }, { status: 401 });
        }

        const body = await req.json();
        const { id, status, appointedDate, isAcknowledged } = body;
        
        if (!id || typeof id !== "string") {
            return NextResponse.json({ error: "Missing booking ID" }, { status: 400 });
        }

        const isStaff = STAFF_ROLES.includes(session.user.role);

        // Sanitize update data
        const updateData: any = {};
        if (status !== undefined) {
            const allowedStatuses = ["pending", "approved", "confirmed", "checked_in", "testing", "training", "completed", "cancelled", "passed", "rejected"];
            if (!allowedStatuses.includes(status)) {
                return NextResponse.json({ error: "สถานะคิวไม่ถูกต้อง" }, { status: 400 });
            }
            updateData.status = status;
        }
        if (appointedDate !== undefined) {
            updateData.appointedDate = appointedDate ? new Date(appointedDate) : null;
        }
        if (isAcknowledged !== undefined) {
            updateData.isAcknowledged = Boolean(isAcknowledged);
        }

        const booking = await prisma.$transaction(async (tx) => {
            const currentBooking = await tx.queueBooking.findUnique({ where: { id } });
            if (!currentBooking) throw new Error("Booking not found");

            // Non-staff members can only cancel their own booking or acknowledge appointment
            if (!isStaff && currentBooking.userId !== session.user.id) {
                throw new Error("Forbidden — คุณไม่มีสิทธิ์จัดการคิวนี้");
            }
            if (!isStaff && status !== undefined && status !== "cancelled") {
                throw new Error("Forbidden — สมาชิกทั่วไปสามารถทำได้เฉพาะการยกเลิกคิวเท่านั้น");
            }

            const updatedBooking = await tx.queueBooking.update({
                where: { id },
                data: updateData,
                include: { user: true }
            });

            // If cancelled, decrement currentQueue
            if (status === "cancelled" && currentBooking.status !== "cancelled") {
                if (currentBooking.bookingType === "training") {
                    await tx.masterCourse.update({
                        where: { id: currentBooking.itemId },
                        data: { currentQueue: { decrement: 1 } }
                    });
                }
            }

            return updatedBooking;
        });

        // Send LINE Notification for status changes (Cancelled or Approved)
        if (status && booking.user?.lineUserId && process.env.LINE_CHANNEL_ACCESS_TOKEN) {
            try {
                const url = "https://api.line.me/v2/bot/message/push";
                const headers = {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`
                };
                
                let title = "";
                let bgColor = "";
                let mainText = "";

                if (status === "cancelled") {
                    title = "การจองคิวถูกยกเลิก";
                    bgColor = "#EF4444"; // Red-500
                    mainText = "ระบบได้ทำการยกเลิกคิวของคุณแล้ว";
                } else if (status === "approved") {
                    title = "คิวของคุณได้รับการอนุมัติ";
                    bgColor = "#10B981"; // Emerald-500
                    mainText = "คุณสามารถมารับบริการตามวันเวลาที่กำหนดได้เลยครับ";
                }

                if (title !== "") {
                    const statusFlexMessage = {
                        type: "flex",
                        altText: `สถานะคิว: ${title}`,
                        contents: {
                            type: "bubble",
                            header: {
                                type: "box",
                                layout: "vertical",
                                backgroundColor: bgColor,
                                contents: [
                                    {
                                        type: "text",
                                        text: title,
                                        color: "#FFFFFF",
                                        weight: "bold",
                                        size: "lg",
                                        align: "center"
                                    }
                                ]
                            },
                            body: {
                                type: "box",
                                layout: "vertical",
                                spacing: "sm",
                                contents: [
                                    {
                                        type: "text",
                                        text: mainText,
                                        wrap: true,
                                        size: "sm",
                                        color: "#475569",
                                        align: "center"
                                    },
                                    {
                                        type: "text",
                                        text: `รายการ: ${booking.itemName}`,
                                        size: "xs",
                                        color: "#64748B",
                                        wrap: true,
                                        align: "center",
                                        margin: "md"
                                    }
                                ]
                            }
                        }
                    };

                    await fetch(url, { 
                        method: "POST", 
                        headers, 
                        body: JSON.stringify({
                            to: booking.user.lineUserId,
                            messages: [statusFlexMessage]
                        }) 
                    });
                }
            } catch (e) {
                console.error("Failed to send LINE status update", e);
            }
        }

        return NextResponse.json(booking);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");
        if (!id) return NextResponse.json({ error: "Missing booking id" }, { status: 400 });

        const isStaff = STAFF_ROLES.includes(session.user.role);
        const existing = await prisma.queueBooking.findUnique({ where: { id } });

        if (!existing) {
            return NextResponse.json({ error: "Booking not found" }, { status: 404 });
        }

        if (!isStaff && existing.userId !== session.user.id) {
            return NextResponse.json({ error: "Forbidden — คุณไม่มีสิทธิ์ลบคิวนี้" }, { status: 403 });
        }

        await prisma.queueBooking.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
