import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { pushMessage } from "@/lib/services/line-service";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { phoneNumber, password, fullName, profileJson, lineUserId } = body;

        if (!phoneNumber || !password) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const existingUser = await prisma.user.findUnique({
            where: { phoneNumber }
        });

        if (existingUser) {
            return NextResponse.json({ error: "เบอร์โทรศัพท์นี้มีผู้ใช้งานแล้ว" }, { status: 400 });
        }

        const passwordHash = await bcrypt.hash(password, 10);
        
        // Generate a random Member ID
        const memberId = "MBR-" + Math.floor(10000000 + Math.random() * 90000000);

        const user = await prisma.user.create({
            data: {
                phoneNumber,
                passwordHash,
                fullName,
                memberId,
                lineUserId: lineUserId || undefined,
                profileJson,
                role: "member"
            }
        });

        // Send LINE Flex Message Welcome Card if lineUserId is linked
        if (user.lineUserId) {
            pushMessage(user.lineUserId, "welcome", {
                fullName: user.fullName,
                memberId: user.memberId,
                phoneNumber: user.phoneNumber
            }).catch(e => console.error("Error pushing welcome LINE message:", e));
        }

        return NextResponse.json({ success: true, user: { id: user.id, phoneNumber: user.phoneNumber, memberId: user.memberId } });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
