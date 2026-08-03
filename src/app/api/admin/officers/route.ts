import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// GET /api/admin/officers — Fetch all officers (role !== "member")
export async function GET() {
    try {
        const officers = await prisma.user.findMany({
            where: {
                role: {
                    not: "member",
                },
            },
            select: {
                id: true,
                fullName: true,
                phoneNumber: true,
                email: true,
                role: true,
                department: true,
                status: true,
                createdAt: true,
                updatedAt: true,
            },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json(officers);
    } catch (error: any) {
        console.error("[officers GET] Error:", error);
        return NextResponse.json({ error: error.message || "Failed to fetch officers" }, { status: 500 });
    }
}

// POST /api/admin/officers — Create new officer
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { fullName, phoneNumber, email, password, role, department } = body;

        if (!phoneNumber || !password || !fullName) {
            return NextResponse.json({ error: "กรุณากรอกชื่อ-นามสกุล, เบอร์โทรศัพท์ และรหัสผ่าน" }, { status: 400 });
        }

        // Check duplicate phone number
        const existingPhone = await prisma.user.findUnique({ where: { phoneNumber } });
        if (existingPhone) {
            return NextResponse.json({ error: "เบอร์โทรศัพท์นี้มีในระบบแล้ว" }, { status: 400 });
        }

        // Check duplicate email if provided
        if (email) {
            const existingEmail = await prisma.user.findUnique({ where: { email } });
            if (existingEmail) {
                return NextResponse.json({ error: "อีเมลนี้มีในระบบแล้ว" }, { status: 400 });
            }
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const newOfficer = await prisma.user.create({
            data: {
                fullName,
                phoneNumber,
                email: email || null,
                passwordHash,
                role: role || "officer_training",
                department: department || "ฝ่ายฝึกอบรมพัฒนาทักษะ",
                status: "active",
            },
            select: {
                id: true,
                fullName: true,
                phoneNumber: true,
                email: true,
                role: true,
                department: true,
                status: true,
                createdAt: true,
            },
        });

        return NextResponse.json(newOfficer, { status: 201 });
    } catch (error: any) {
        console.error("[officers POST] Error:", error);
        return NextResponse.json({ error: error.message || "Failed to create officer" }, { status: 500 });
    }
}

// PUT /api/admin/officers — Update officer details or reset password
export async function PUT(req: Request) {
    try {
        const body = await req.json();
        const { id, fullName, phoneNumber, email, role, department, status, password } = body;

        if (!id) {
            return NextResponse.json({ error: "Missing officer ID" }, { status: 400 });
        }

        const updateData: any = {};
        if (fullName !== undefined) updateData.fullName = fullName;
        if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber;
        if (email !== undefined) updateData.email = email || null;
        if (role !== undefined) updateData.role = role;
        if (department !== undefined) updateData.department = department;
        if (status !== undefined) updateData.status = status;

        if (password) {
            updateData.passwordHash = await bcrypt.hash(password, 10);
        }

        const updated = await prisma.user.update({
            where: { id },
            data: updateData,
            select: {
                id: true,
                fullName: true,
                phoneNumber: true,
                email: true,
                role: true,
                department: true,
                status: true,
                updatedAt: true,
            },
        });

        return NextResponse.json(updated);
    } catch (error: any) {
        console.error("[officers PUT] Error:", error);
        return NextResponse.json({ error: error.message || "Failed to update officer" }, { status: 500 });
    }
}

// DELETE /api/admin/officers?id=xxx — Delete officer account
export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({ error: "Missing officer ID" }, { status: 400 });
        }

        // Count total admins to avoid deleting the last super admin
        const totalAdmins = await prisma.user.count({
            where: { role: "admin" },
        });

        const targetUser = await prisma.user.findUnique({ where: { id } });

        if (targetUser?.role === "admin" && totalAdmins <= 1) {
            return NextResponse.json({ error: "ไม่สามารถลบบัญชี Super Admin บัญชีสุดท้ายของระบบได้" }, { status: 400 });
        }

        await prisma.user.delete({ where: { id } });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("[officers DELETE] Error:", error);
        return NextResponse.json({ error: error.message || "Failed to delete officer" }, { status: 500 });
    }
}
