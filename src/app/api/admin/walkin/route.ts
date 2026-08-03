import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { checkStaffAuth } from "@/lib/auth-guard";

// POST /api/admin/walkin — Register walk-in member and/or book instant queue
export async function POST(req: Request) {
    try {
        const { errorResponse } = await checkStaffAuth();
        if (errorResponse) return errorResponse;

        const body = await req.json();
        const {
            existingUserId,
            // Member creation fields (if existingUserId is not provided)
            title,
            fullName,
            phoneNumber,
            citizenId,
            email,
            education,
            addressProvince,
            addressDistrict,
            addressSubdistrict,
            // Queue booking fields
            type, // "training" or "test"
            itemId,
            itemName,
            appointedDate,
        } = body;

        let targetUser: any = null;

        // 1. Resolve or Create User Account
        if (existingUserId) {
            if (typeof existingUserId !== "string") {
                return NextResponse.json({ error: "ID สมาชิกไม่ถูกต้อง" }, { status: 400 });
            }
            targetUser = await prisma.user.findUnique({
                where: { id: existingUserId },
            });
            if (!targetUser) {
                return NextResponse.json({ error: "ไม่พบข้อมูลสมาชิกในระบบ" }, { status: 404 });
            }
        } else {
            // Validate required fields for new walk-in member
            if (!fullName || typeof fullName !== "string" || !fullName.trim()) {
                return NextResponse.json({ error: "กรุณากรอกชื่อ-นามสกุลให้ถูกต้อง" }, { status: 400 });
            }
            if (!phoneNumber || typeof phoneNumber !== "string") {
                return NextResponse.json({ error: "กรุณากรอกเบอร์โทรศัพท์ให้ถูกต้อง" }, { status: 400 });
            }

            const cleanPhone = phoneNumber.replace(/[^0-9]/g, "");
            if (cleanPhone.length < 9 || cleanPhone.length > 10) {
                return NextResponse.json({ error: "กรุณากรอกเบอร์โทรศัพท์ 9-10 หลัก" }, { status: 400 });
            }
            const cleanCitizen = (citizenId || "").replace(/[^0-9]/g, "");

            // Check duplicate phone
            const existingPhone = await prisma.user.findUnique({
                where: { phoneNumber: cleanPhone },
            });

            if (existingPhone) {
                targetUser = existingPhone; // Use existing user if phone matches
            } else {
                // Generate default password (last 6 digits of citizen ID or phone)
                const defaultPass = cleanCitizen.length >= 6
                    ? cleanCitizen.slice(-6)
                    : cleanPhone.slice(-6);

                const passwordHash = await bcrypt.hash(defaultPass, 10);
                const generatedMemberId = `WALK-${Date.now().toString().slice(-6)}`;

                // Build profileJson
                const profileObj = {
                    reg_title: title || "001",
                    reg_firstname: fullName.trim().split(" ")[0] || fullName.trim(),
                    reg_lastname: fullName.trim().split(" ").slice(1).join(" ") || "",
                    reg_telephone: cleanPhone,
                    reg_citizenid: cleanCitizen,
                    reg_email: email ? String(email).trim() : "",
                    reg_education: education ? String(education).trim() : "",
                    reg_address_province: addressProvince ? String(addressProvince).trim() : "ยะลา",
                    reg_address_district: addressDistrict ? String(addressDistrict).trim() : "",
                    reg_address_subdistrict: addressSubdistrict ? String(addressSubdistrict).trim() : "",
                    walkInRegistered: true,
                };

                targetUser = await prisma.user.create({
                    data: {
                        phoneNumber: cleanPhone,
                        fullName: fullName.trim(),
                        email: email ? String(email).trim() : null,
                        passwordHash,
                        role: "member",
                        memberId: generatedMemberId,
                        profileJson: JSON.stringify(profileObj),
                    },
                });
            }
        }

        // 2. If queue booking parameters are provided, issue instant Walk-in queue
        let newBooking: any = null;
        let queueTicketCode = "";

        if (type || itemId || itemName) {
            if (!type || !["training", "test"].includes(type)) {
                return NextResponse.json({ error: "ประเภทการบริการต้องเป็น training หรือ test" }, { status: 400 });
            }
            if (!itemId || typeof itemId !== "string" || !itemName || typeof itemName !== "string") {
                return NextResponse.json({ error: "กรุณาระบุหลักสูตร/สาขาที่จะเข้ารับบริการ" }, { status: 400 });
            }

            // Find highest existing queue number for this item
            const latestBooking = await prisma.queueBooking.findFirst({
                where: {
                    bookingType: type,
                    itemId: itemId,
                },
                orderBy: { queueNumber: "desc" },
            });

            const nextQueueNumber = (latestBooking?.queueNumber || 0) + 1;
            const prefix = type === "training" ? "TRN" : "TST";
            queueTicketCode = `${prefix}-${String(nextQueueNumber).padStart(3, "0")}`;

            const appointmentDateObj = appointedDate ? new Date(appointedDate) : new Date();

            newBooking = await prisma.queueBooking.create({
                data: {
                    userId: targetUser.id,
                    bookingType: type,
                    itemId: itemId,
                    itemName: itemName.trim(),
                    status: "checked_in", // Walk-in is automatically checked-in at reception
                    queueNumber: nextQueueNumber,
                    appointedDate: appointmentDateObj,
                    bookingDate: new Date(),
                },
            });
        }

        return NextResponse.json(
            {
                success: true,
                user: {
                    id: targetUser.id,
                    fullName: targetUser.fullName,
                    phoneNumber: targetUser.phoneNumber,
                    memberId: targetUser.memberId,
                },
                booking: newBooking,
                ticketCode: queueTicketCode,
            },
            { status: 201 }
        );
    } catch (error: any) {
        console.error("[walkin POST] Error:", error);
        return NextResponse.json({ error: error.message || "Failed to register walk-in" }, { status: 500 });
    }
}
