import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseProfileJson } from "@/lib/jsonEngine";
import { checkStaffAuth } from "@/lib/auth-guard";

/**
 * GET /api/admin/export-csv?courseId=xxx&courseName=yyy
 *
 * Exports enrolled members signature list (ใบเซ็นชื่อ) as a UTF-8 BOM CSV file
 * suitable for opening directly in Microsoft Excel without character encoding issues.
 */

function escapeCsvField(val: any): string {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
}

function resolveTitle(code: string): string {
    if (code === "001") return "นาย";
    if (code === "002") return "นาง";
    if (code === "003") return "นางสาว";
    return code || "";
}

export async function GET(req: Request) {
    try {
        const { errorResponse } = await checkStaffAuth();
        if (errorResponse) return errorResponse;

        const { searchParams } = new URL(req.url);
        const courseId = searchParams.get("courseId");
        const courseName = searchParams.get("courseName");
        const mode = searchParams.get("mode") || "training"; // "training" | "test" | "all"

        let users: any[] = [];

        if (courseId) {
            const bookings = await prisma.queueBooking.findMany({
                where: {
                    itemId: courseId,
                    ...(mode !== "all" ? { bookingType: mode } : {}),
                },
                include: {
                    user: true,
                },
                orderBy: { queueNumber: "asc" },
            });

            const seen = new Set<string>();
            users = bookings
                .filter((q) => {
                    if (seen.has(q.userId)) return false;
                    seen.add(q.userId);
                    return true;
                })
                .map((q) => q.user);
        } else {
            users = await prisma.user.findMany({
                where: { role: "member" },
                orderBy: { createdAt: "desc" },
            });
        }

        // CSV Header for Signature Sheet (ใบเซ็นชื่อ)
        const headers = [
            "ลำดับ",
            "รหัสสมาชิก",
            "เลขบัตรประชาชน",
            "คำนำหน้า",
            "ชื่อ",
            "นามสกุล",
            "เบอร์โทรศัพท์",
            "อีเมล",
            "จังหวัด",
            "อำเภอ",
            "ตำบล",
            "ลายมือชื่อเข้าร่วม",
            "หมายเหตุ",
        ];

        const csvRows: string[] = [headers.map(escapeCsvField).join(",")];

        users.forEach((user: any, index: number) => {
            const profile = parseProfileJson(user.profileJson || null, {
                createdAt: user.createdAt,
            });

            const title = resolveTitle(profile.reg_title || "");
            const firstname = profile.reg_firstname || user.fullName?.split(" ")[0] || "";
            const lastname = profile.reg_lastname || user.fullName?.split(" ").slice(1).join(" ") || "";
            const citizenId = profile.reg_citizenid || "";
            const phone = profile.reg_telephone || user.phoneNumber || "";
            const email = profile.reg_email || user.email || "";
            const province = profile.reg_address_province || "";
            const district = profile.reg_address_district || "";
            const subdistrict = profile.reg_address_subdistrict || "";

            const row = [
                index + 1,
                user.memberId || user.id,
                citizenId,
                title,
                firstname,
                lastname,
                phone,
                email,
                province,
                district,
                subdistrict,
                "", // Signature blank column
                "", // Remarks blank column
            ];

            csvRows.push(row.map(escapeCsvField).join(","));
        });

        // Add UTF-8 BOM (\uFEFF) at the start so Excel recognizes Thai characters correctly
        const csvContent = "\uFEFF" + csvRows.join("\r\n");

        const safeName = courseName
            ? courseName.replace(/[^ก-๙a-zA-Z0-9_ ]/g, "").trim().replace(/ /g, "_")
            : "ใบเซ็นชื่อ_DSD_Yala";

        const filename = `${safeName}.csv`;

        return new NextResponse(csvContent, {
            status: 200,
            headers: {
                "Content-Type": "text/csv; charset=utf-8",
                "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
            },
        });
    } catch (error: any) {
        console.error("[export-csv] Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
