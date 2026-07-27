import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseProfileJson } from "@/lib/jsonEngine";

/**
 * GET /api/admin/export-json?courseId=xxx&courseName=yyy
 *
 * Exports all members enrolled in a given course/training queue
 * as a DSD-standard 50-field JSON array — identical to the reference format
 * (e.g., จักรยานยนต์ไฟฟ้า_รุ่นที่_1.json).
 *
 * Rules applied:
 *  1. Passes each member's profileJson through parseProfileJson() to ensure
 *     all 50 DSD standard fields exist with correct default values.
 *  2. Strips the "data:image/...;base64," prefix from profileImage so only
 *     the raw Base64 string remains.
 *  3. Removes non-DSD internal fields (password, id, role, memberId, etc.)
 *     before writing the output.
 */

// Ordered list of the 50 DSD-standard fields (output order must match reference)
const DSD_FIELD_ORDER = [
    "register_type",
    "reg_title",
    "reg_firstname",
    "reg_lastname",
    "reg_firstnameEng",
    "reg_lastnameEng",
    "reg_citizenid",
    "reg_birth",
    "reg_telephone",
    "reg_email",
    "reg_address_no",
    "reg_address_moo",
    "reg_address_street",
    "reg_address_soi",
    "reg_address_province",
    "reg_address_district",
    "reg_address_subdistrict",
    "reg_education",
    "reg_education_section",
    "reg_body_state",
    "reg_body_state_detail",
    "work_state",
    "work_section",
    "work_section_gov",
    "work_section_self",
    "work_section_detail",
    "work_salary",
    "work_occupation",
    "work_position",
    "work_experience",
    "work_place",
    "work_province",
    "work_telephone",
    "work_fax",
    "work_group",
    "work_group_other",
    "unwork_type",
    "unwork_other",
    "info_type",
    "info_agree",
    "info_findjob",
    "info_findjob_detail",
    "info_findjob_detail_industry",
    "sign_img",
    "regist_date",
    "official",
    "gender",
    "nationality",
    "postcode",
    "info_findjob_country",
    "industry_desc",
    "profileImage",
    "info_findjob_detail_industry_desc",
    "reg_title_en",
] as const;

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const courseId = searchParams.get("courseId");
        const courseName = searchParams.get("courseName");
        const mode = searchParams.get("mode") || "training"; // "training" | "test" | "all"

        let users: any[] = [];

        if (courseId) {
            // Fetch members who have a booking entry for this specific course
            const bookings = await prisma.queueBooking.findMany({
                where: {
                    itemId: courseId,
                    ...(mode !== "all" ? { bookingType: mode } : {}),
                },
                include: {
                    user: true,
                },
            });

            // Deduplicate by userId
            const seen = new Set<string>();
            users = bookings
                .filter((q) => {
                    if (seen.has(q.userId)) return false;
                    seen.add(q.userId);
                    return true;
                })
                .map((q) => q.user);
        } else {
            // No filter → export ALL members (role = "member")
            users = await prisma.user.findMany({
                where: { role: "member" },
            });
        }

        // Transform each user into a clean DSD 50-field object
        const output = users.map((user: any) => {
            // 1. Parse & hydrate the profile data through our jsonEngine
            const profile = parseProfileJson(user.profileJson || null, {
                createdAt: user.createdAt,
            });

            // 2. Merge key fields from the user table that might not be in profileJson
            if (!profile.reg_telephone && user.phoneNumber) {
                profile.reg_telephone = user.phoneNumber;
            }
            if (!profile.reg_email && user.email) {
                profile.reg_email = user.email;
            }
            if (!profile.regist_date && user.createdAt) {
                profile.regist_date = new Date(user.createdAt).toISOString();
            }

            // 3. Strip "data:image/...;base64," prefix from profileImage (DSD standard = raw Base64 only)
            if (profile.profileImage && profile.profileImage.startsWith("data:")) {
                profile.profileImage = profile.profileImage.replace(/^data:image\/\w+;base64,/, "");
            }

            // 4. Build the output object in strict DSD field order
            const ordered: Record<string, any> = {};
            for (const field of DSD_FIELD_ORDER) {
                // Use profile value; fall back to "" for any missing field
                ordered[field] = (profile as any)[field] ?? "";
            }

            return ordered;
        });

        // Build filename from courseName or a default
        const safeName = courseName
            ? courseName.replace(/[^ก-๙a-zA-Z0-9_ ]/g, "").trim().replace(/ /g, "_")
            : "DSD_Export";

        const filename = `${safeName}.json`;

        return new NextResponse(JSON.stringify(output, null, 0), {
            status: 200,
            headers: {
                "Content-Type": "application/json; charset=utf-8",
                "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
            },
        });
    } catch (error: any) {
        console.error("[export-json] Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
