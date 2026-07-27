import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
    try {
        const { key, value } = await req.json();

        if (!key || value === undefined) {
            return NextResponse.json({ error: "Missing key or value" }, { status: 400 });
        }

        const setting = await prisma.systemSetting.upsert({
            where: { key },
            update: { value: String(value) },
            create: { key, value: String(value) }
        });

        return NextResponse.json({ success: true, setting });
    } catch (error: any) {
        console.error("Update setting error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
