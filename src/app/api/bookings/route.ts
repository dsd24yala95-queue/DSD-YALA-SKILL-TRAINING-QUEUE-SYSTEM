import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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
        const body = await req.json();
        
        // Use a Prisma transaction for Concurrency Safety
        const booking = await prisma.$transaction(async (tx) => {
            // 1. Check for duplicate active bookings for this specific item
            const activeBooking = await tx.queueBooking.findFirst({
                where: {
                    userId: body.userId,
                    itemId: body.itemId,
                    status: {
                        in: ["pending", "approved", "confirmed", "checked_in", "testing", "training"]
                    }
                }
            });

            if (activeBooking) {
                throw new Error("ไม่สามารถจองซ้ำได้ เนื่องจากคุณมีคิวที่กำลังรอดำเนินการสำหรับบริการนี้อยู่แล้ว");
            }

            // 2. Check Quota and lock the row (by updating or fetching inside transaction)
            let queueNumber = 1;

            if (body.bookingType === "training") {
                const course = await tx.masterCourse.findUnique({ where: { id: body.itemId } });
                if (!course) throw new Error("ไม่พบหลักสูตรนี้");
                if (course.currentQueue >= course.maxSeats) {
                    throw new Error("เต็มโควต้าแล้ว ไม่สามารถจองได้");
                }
                
                // Increment currentQueue
                const updatedCourse = await tx.masterCourse.update({
                    where: { id: body.itemId },
                    data: { currentQueue: { increment: 1 } }
                });
                // In a true queue system, queueNumber could just be the new currentQueue
                queueNumber = updatedCourse.currentQueue;
                
            } else if (body.bookingType === "test") {
                // Assuming Test queues use MasterBranch
                // We'll calculate queue number based on today's bookings for the branch
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                const count = await tx.queueBooking.count({
                    where: {
                        itemId: body.itemId,
                        bookingDate: { gte: today }
                    }
                });

                // Wait, do we need to check maxQueue for Test Branch?
                // Let's fetch branch to check maxQueue
                const branch = await tx.masterBranch.findUnique({ where: { id: body.itemId } });
                if (branch && count >= branch.maxQueue) {
                    throw new Error("คิวทดสอบของวันนี้เต็มแล้ว");
                }
                queueNumber = count + 1;
            }

            // 3. Create the booking record
            const newBooking = await tx.queueBooking.create({
                data: {
                    userId: body.userId,
                    bookingType: body.bookingType,
                    itemId: body.itemId,
                    itemName: body.itemName,
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

        return NextResponse.json(booking);
    } catch (error: any) {
        // Return 400 for known business logic errors
        if (error.message.includes("ไม่สามารถ") || error.message.includes("เต็ม")) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    try {
        const body = await req.json();
        const { id, ...data } = body;
        
        const booking = await prisma.$transaction(async (tx) => {
            const currentBooking = await tx.queueBooking.findUnique({ where: { id } });
            if (!currentBooking) throw new Error("Booking not found");

            const updatedBooking = await tx.queueBooking.update({
                where: { id },
                data,
                include: { user: true }
            });

            // If cancelled, decrement currentQueue
            if (data.status === "cancelled" && currentBooking.status !== "cancelled") {
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
        if (data.status && booking.user?.lineUserId && process.env.LINE_CHANNEL_ACCESS_TOKEN) {
            try {
                const url = "https://api.line.me/v2/bot/message/push";
                const headers = {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`
                };
                
                let title = "";
                let bgColor = "";
                let mainText = "";

                if (data.status === "cancelled") {
                    title = "การจองคิวถูกยกเลิก";
                    bgColor = "#EF4444"; // Red-500
                    mainText = "ระบบได้ทำการยกเลิกคิวของคุณแล้ว";
                } else if (data.status === "approved") {
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
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");
        if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
        await prisma.queueBooking.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
