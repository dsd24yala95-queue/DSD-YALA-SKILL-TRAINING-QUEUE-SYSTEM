import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");
        const role = searchParams.get("role");

        if (id) {
            const user = await prisma.user.findUnique({ where: { id } });
            return NextResponse.json(user);
        }

        if (role) {
            const users = await prisma.user.findMany({ where: { role } });
            return NextResponse.json(users);
        }

        const users = await prisma.user.findMany();
        return NextResponse.json(users);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    try {
        const body = await req.json();
        const { id, ...data } = body;

        if (!id) return NextResponse.json({ error: "Missing user id" }, { status: 400 });

        const updated = await prisma.user.update({
            where: { id },
            data
        });
        
        return NextResponse.json(updated);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');
        
        if (!id) return NextResponse.json({ error: 'Missing user id' }, { status: 400 });
        
        await prisma.user.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}