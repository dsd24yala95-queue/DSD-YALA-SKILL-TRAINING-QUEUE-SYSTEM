import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { NextResponse } from "next/server";

export const STAFF_ROLES = ["admin", "officer_training", "officer_test", "officer_registrar"];

export async function checkStaffAuth() {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return {
            session: null,
            errorResponse: NextResponse.json(
                { error: "Unauthorized — กรุณาเข้าสู่ระบบก่อนใช้งาน" },
                { status: 401 }
            )
        };
    }

    const role = session.user.role;
    if (!role || role === "member" || !STAFF_ROLES.includes(role)) {
        return {
            session,
            errorResponse: NextResponse.json(
                { error: "Forbidden — คุณไม่มีสิทธิ์เข้าถึงฟังก์ชั่นสำหรับเจ้าหน้าที่" },
                { status: 403 }
            )
        };
    }

    return { session, errorResponse: null };
}

export async function checkSuperAdminAuth() {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return {
            session: null,
            errorResponse: NextResponse.json(
                { error: "Unauthorized — กรุณาเข้าสู่ระบบก่อนใช้งาน" },
                { status: 401 }
            )
        };
    }

    if (session.user.role !== "admin") {
        return {
            session,
            errorResponse: NextResponse.json(
                { error: "Forbidden — เฉพาะ Super Admin เท่านั้นที่มีสิทธิ์ดำเนินการ" },
                { status: 403 }
            )
        };
    }

    return { session, errorResponse: null };
}
