import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { checkStaffAuth, checkSuperAdminAuth, STAFF_ROLES } from "@/lib/auth-guard";

// GET /api/admin/officers — Fetch all officers (role !== "member")
export async function GET() {
    try {
        const { errorResponse } = await checkStaffAuth();
        if (errorResponse) return errorResponse;

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
                mustChangePassword: true,
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

// POST /api/admin/officers — Create new officer (Super Admin only)
export async function POST(req: Request) {
    try {
        const { errorResponse } = await checkSuperAdminAuth();
        if (errorResponse) return errorResponse;

        const body = await req.json();
        const { fullName, phoneNumber, email, password, role, department } = body;

        if (!fullName || typeof fullName !== "string" || !fullName.trim()) {
            return NextResponse.json({ error: "กรุณากรอกชื่อ-นามสกุลให้ถูกต้อง" }, { status: 400 });
        }
        if (!phoneNumber || typeof phoneNumber !== "string") {
            return NextResponse.json({ error: "กรุณากรอกเบอร์โทรศัพท์ให้ถูกต้อง" }, { status: 400 });
        }
        if (!password || typeof password !== "string" || password.length < 6) {
            return NextResponse.json({ error: "รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร" }, { status: 400 });
        }

        const cleanPhone = String(phoneNumber).trim();
        if (cleanPhone.length < 3) {
            return NextResponse.json({ error: "Username หรือเบอร์โทรศัพท์ต้องมีความยาวอย่างน้อย 3 ตัวอักษร" }, { status: 400 });
        }

        const assignedRole = role || "officer_training";
        const isValidRoleString = (roleStr: string) => {
            const roles = roleStr.split(",").map((r) => r.trim());
            return roles.length > 0 && roles.every((r) => STAFF_ROLES.includes(r));
        };

        if (!isValidRoleString(assignedRole)) {
            return NextResponse.json({ error: "ตำแหน่ง/สิทธิ์การใช้งานไม่ถูกต้อง" }, { status: 400 });
        }

        // Check duplicate phone number
        const existingPhone = await prisma.user.findUnique({ where: { phoneNumber: cleanPhone } });
        if (existingPhone) {
            return NextResponse.json({ error: "เบอร์โทรศัพท์นี้มีในระบบแล้ว" }, { status: 400 });
        }

        // Check duplicate email if provided
        const cleanEmail = email ? String(email).trim().toLowerCase() : null;
        if (cleanEmail) {
            const existingEmail = await prisma.user.findUnique({ where: { email: cleanEmail } });
            if (existingEmail) {
                return NextResponse.json({ error: "อีเมลนี้มีในระบบแล้ว" }, { status: 400 });
            }
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const newOfficer = await prisma.user.create({
            data: {
                fullName: fullName.trim(),
                phoneNumber: cleanPhone,
                email: cleanEmail,
                passwordHash,
                role: assignedRole,
                department: department ? String(department).trim() : "ฝ่ายฝึกอบรมพัฒนาทักษะ",
                status: "active",
                mustChangePassword: true, // Force password change on first login
            },
            select: {
                id: true,
                fullName: true,
                phoneNumber: true,
                email: true,
                role: true,
                department: true,
                status: true,
                mustChangePassword: true,
                createdAt: true,
            },
        });

        return NextResponse.json(newOfficer, { status: 201 });
    } catch (error: any) {
        console.error("[officers POST] Error:", error);
        return NextResponse.json({ error: error.message || "Failed to create officer" }, { status: 500 });
    }
}

// PUT /api/admin/officers — Update officer details or reset password (Super Admin only)
export async function PUT(req: Request) {
    try {
        const { errorResponse } = await checkSuperAdminAuth();
        if (errorResponse) return errorResponse;

        const body = await req.json();
        const { id, fullName, phoneNumber, email, role, department, status, password, resetDefaultPassword, mustChangePassword } = body;

        if (!id || typeof id !== "string") {
            return NextResponse.json({ error: "Missing or invalid officer ID" }, { status: 400 });
        }

        const updateData: any = {};
        if (fullName !== undefined) updateData.fullName = String(fullName).trim();
        if (phoneNumber !== undefined) {
            const cleanPhone = String(phoneNumber).trim();
            if (cleanPhone.length < 3) {
                return NextResponse.json({ error: "Username หรือเบอร์โทรศัพท์ต้องมีความยาวอย่างน้อย 3 ตัวอักษร" }, { status: 400 });
            }
            updateData.phoneNumber = cleanPhone;
        }
        if (email !== undefined) updateData.email = email ? String(email).trim().toLowerCase() : null;
        if (role !== undefined) {
            const isValidRoleString = (roleStr: string) => {
                const roles = roleStr.split(",").map((r) => r.trim());
                return roles.length > 0 && roles.every((r) => STAFF_ROLES.includes(r));
            };
            if (!isValidRoleString(role)) {
                return NextResponse.json({ error: "ตำแหน่ง/สิทธิ์การใช้งานไม่ถูกต้อง" }, { status: 400 });
            }
            updateData.role = role;
        }
        if (department !== undefined) updateData.department = String(department).trim();
        if (status !== undefined) updateData.status = status === "inactive" ? "inactive" : "active";
        if (mustChangePassword !== undefined) updateData.mustChangePassword = Boolean(mustChangePassword);

        // Reset to default password "1234567890" or custom password
        if (resetDefaultPassword) {
            updateData.passwordHash = await bcrypt.hash("1234567890", 10);
            updateData.mustChangePassword = true; // Force password change on login
        } else if (password) {
            if (typeof password !== "string" || password.length < 6) {
                return NextResponse.json({ error: "รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร" }, { status: 400 });
            }
            updateData.passwordHash = await bcrypt.hash(password, 10);
            updateData.mustChangePassword = true; // Force password change on login
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
                mustChangePassword: true,
                updatedAt: true,
            },
        });

        return NextResponse.json(updated);
    } catch (error: any) {
        console.error("[officers PUT] Error:", error);
        return NextResponse.json({ error: error.message || "Failed to update officer" }, { status: 500 });
    }
}

// DELETE /api/admin/officers?id=xxx — Delete officer account (Super Admin only)
export async function DELETE(req: Request) {
    try {
        const { errorResponse } = await checkSuperAdminAuth();
        if (errorResponse) return errorResponse;

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
