import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { STAFF_ROLES, hasStaffPermission } from "@/lib/auth-guard";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");
        const role = searchParams.get("role");

        if (id) {
            const user = await prisma.user.findUnique({
                where: { id },
                select: {
                    id: true,
                    email: true,
                    phoneNumber: true,
                    fullName: true,
                    role: true,
                    department: true,
                    status: true,
                    memberId: true,
                    lineUserId: true,
                    profileJson: true,
                    createdAt: true,
                    updatedAt: true,
                }
            });
            return NextResponse.json(user);
        }

        if (role) {
            const users = await prisma.user.findMany({
                where: { role },
                select: {
                    id: true,
                    email: true,
                    phoneNumber: true,
                    fullName: true,
                    role: true,
                    department: true,
                    status: true,
                    memberId: true,
                    lineUserId: true,
                    profileJson: true,
                    createdAt: true,
                },
                orderBy: { createdAt: "desc" }
            });
            return NextResponse.json(users);
        }

        const users = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                phoneNumber: true,
                fullName: true,
                role: true,
                department: true,
                status: true,
                memberId: true,
                createdAt: true,
            },
            orderBy: { createdAt: "desc" }
        });
        return NextResponse.json(users);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized — กรุณาเข้าสู่ระบบก่อนดำเนินการ" }, { status: 401 });
        }

        const body = await req.json();
        const { id, fullName, phoneNumber, email, profileJson, role, status, department } = body;

        if (!id || typeof id !== "string") {
            return NextResponse.json({ error: "Missing or invalid user id" }, { status: 400 });
        }

        const isStaff = hasStaffPermission(session.user.role);
        const isSelf = session.user.id === id;

        if (!isStaff && !isSelf) {
            return NextResponse.json({ error: "Forbidden — คุณไม่มีสิทธิ์แก้ไขข้อมูลของผู้ใช้อื่น" }, { status: 403 });
        }

        const updateData: any = {};
        if (fullName !== undefined) updateData.fullName = fullName ? String(fullName).trim() : null;
        if (phoneNumber !== undefined) updateData.phoneNumber = String(phoneNumber).replace(/[^0-9]/g, "");
        if (email !== undefined) updateData.email = email ? String(email).trim().toLowerCase() : null;
        if (profileJson !== undefined) updateData.profileJson = typeof profileJson === "string" ? profileJson : JSON.stringify(profileJson);

        // Sensitive fields can only be modified by Super Admin
        if (session.user.role === "admin") {
            if (role !== undefined && STAFF_ROLES.concat("member").includes(role)) {
                updateData.role = role;
            }
            if (status !== undefined) updateData.status = status === "inactive" ? "inactive" : "active";
            if (department !== undefined) updateData.department = String(department).trim();
        }

        const updated = await prisma.user.update({
            where: { id },
            data: updateData,
            select: {
                id: true,
                email: true,
                phoneNumber: true,
                fullName: true,
                role: true,
                department: true,
                status: true,
                memberId: true,
                profileJson: true,
                updatedAt: true,
            }
        });
        
        return NextResponse.json(updated);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user || !hasStaffPermission(session.user.role)) {
            return NextResponse.json({ error: "Forbidden — เฉพาะเจ้าหน้าที่ที่มีสิทธิ์ลบข้อมูลสมาชิก" }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');
        
        if (!id) return NextResponse.json({ error: 'Missing user id' }, { status: 400 });
        
        await prisma.user.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}