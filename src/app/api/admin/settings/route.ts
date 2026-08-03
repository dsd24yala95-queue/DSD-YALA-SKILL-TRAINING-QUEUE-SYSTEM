import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkStaffAuth } from "@/lib/auth-guard";

export async function POST(req: Request) {
    try {
        const { errorResponse } = await checkStaffAuth();
        if (errorResponse) return errorResponse;

        const body = await req.json();
        const { key, value } = body;

        if (!key || typeof key !== "string" || !key.trim() || value === undefined) {
            return NextResponse.json({ error: "Missing or invalid key or value" }, { status: 400 });
        }

        const setting = await prisma.systemSetting.upsert({
            where: { key: key.trim() },
            update: { value: String(value) },
            create: { key: key.trim(), value: String(value) }
        });

        return NextResponse.json({ success: true, setting });
    } catch (error: any) {
        console.error("Update setting error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
