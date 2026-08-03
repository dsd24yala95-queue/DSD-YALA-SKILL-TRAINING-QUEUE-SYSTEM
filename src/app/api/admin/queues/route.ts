import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkStaffAuth } from "@/lib/auth-guard";

export async function GET() {
    try {
        const { errorResponse } = await checkStaffAuth();
        if (errorResponse) return errorResponse;

        const bookings = await prisma.queueBooking.findMany({
            include: {
                user: {
                    select: {
                        fullName: true,
                        phoneNumber: true,
                        profileJson: true
                    }
                }
            },
            orderBy: { createdAt: "desc" }
        });

        // Map to format expected by AdminQueuePage
        const rows = bookings.map(b => {
            let name = b.user?.fullName || "";
            // Fix legacy data where title codes were saved directly into fullName
            if (name.startsWith("001")) name = name.replace(/^001/, "นาย ");
            else if (name.startsWith("002")) name = name.replace(/^002/, "นาง ");
            else if (name.startsWith("003")) name = name.replace(/^003/, "นางสาว ");

            if (!name && b.user?.profileJson) {
                try {
                    const pj = JSON.parse(b.user.profileJson);
                    const t = pj.reg_title === "001" ? "นาย " : pj.reg_title === "002" ? "นาง " : pj.reg_title === "003" ? "นางสาว " : "";
                    name = `${t}${pj.reg_firstname || ""} ${pj.reg_lastname || ""}`.trim();
                } catch(e) {}
            }
            
            return {
                id: b.id,
                userId: b.userId,
                memberName: name || "ไม่ระบุชื่อ",
                memberPhone: b.user?.phoneNumber || "-",
                type: b.bookingType,
                itemId: b.itemId,
                itemName: b.itemName,
                status: b.status,
                queueNumber: b.queueNumber,
                appointedDate: (b as any).appointedDate || "",
                createdAt: b.createdAt,
                profileJson: b.user?.profileJson || null
            };
        });

        return NextResponse.json(rows);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
