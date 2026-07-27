/**
 * LINE Messaging API Service
 * Generates and pushes rich LINE Flex Messages for all key system events.
 */

export async function pushMessage(lineUserId: string, messageType: string, data: any) {
    const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
    if (!token) {
        console.warn("LINE_CHANNEL_ACCESS_TOKEN is missing. Cannot send message to LINE.");
        return { success: false, error: "Missing LINE Token" };
    }

    if (!lineUserId) {
        console.warn("Target LINE User ID is missing.");
        return { success: false, error: "Missing Target ID" };
    }

    const messageTemplate = generateMessageTemplate(messageType, data);
    if (!messageTemplate) {
        console.warn("Invalid message template type:", messageType);
        return { success: false, error: "Invalid Template" };
    }

    try {
        const response = await fetch("https://api.line.me/v2/bot/message/push", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
                to: lineUserId,
                messages: [messageTemplate]
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error("LINE API Error:", errorData);
            return { success: false, error: errorData.message };
        }

        return { success: true };
    } catch (error: any) {
        console.error("Failed to push LINE message:", error);
        return { success: false, error: error.message };
    }
}

export function generateMessageTemplate(messageType: string, data: any) {
    const appUrl = process.env.NEXTAUTH_URL || "https://dsd-yala-skill-training-queue-system.onrender.com";

    switch (messageType) {
        // 1. Welcome & Registration Flex Card
        case "welcome":
            return {
                type: "flex",
                altText: "ยินดีต้อนรับสมาชิกใหม่ - สพร.24 ยะลา",
                contents: {
                    type: "bubble",
                    header: {
                        type: "box",
                        layout: "vertical",
                        backgroundColor: "#2563EB",
                        contents: [
                            { type: "text", text: "ยินดีต้อนรับสมาชิกใหม่!", color: "#FFFFFF", weight: "bold", size: "lg", align: "center" },
                            { type: "text", text: "สถาบันพัฒนาฝีมือแรงงาน 24 ยะลา", color: "#DBEAFE", size: "xs", align: "center", margin: "xs" }
                        ]
                    },
                    body: {
                        type: "box",
                        layout: "vertical",
                        contents: [
                            { type: "text", text: `สวัสดีคุณ ${data.fullName || "สมาชิก"}`, weight: "bold", size: "sm" },
                            { type: "text", text: "การลงทะเบียนบัญชีสมาชิกของคุณเสร็จสมบูรณ์เรียบร้อยแล้ว", size: "xs", color: "#64748B", margin: "xs", wrap: true },
                            {
                                type: "box",
                                layout: "vertical",
                                margin: "md",
                                backgroundColor: "#F8FAFC",
                                paddingAll: "md",
                                cornerRadius: "md",
                                contents: [
                                    {
                                        type: "box",
                                        layout: "horizontal",
                                        contents: [
                                            { type: "text", text: "รหัสสมาชิก:", size: "xs", color: "#64748B" },
                                            { type: "text", text: data.memberId || "-", size: "xs", weight: "bold", color: "#2563EB", align: "end" }
                                        ]
                                    },
                                    {
                                        type: "box",
                                        layout: "horizontal",
                                        margin: "xs",
                                        contents: [
                                            { type: "text", text: "เบอร์โทรศัพท์:", size: "xs", color: "#64748B" },
                                            { type: "text", text: data.phoneNumber || "-", size: "xs", weight: "bold", align: "end" }
                                        ]
                                    }
                                ]
                            }
                        ]
                    },
                    footer: {
                        type: "box",
                        layout: "vertical",
                        contents: [
                            {
                                type: "button",
                                action: { type: "uri", label: "เข้าสู่ระบบเพื่อจองคิว", uri: `${appUrl}/login` },
                                style: "primary",
                                color: "#2563EB"
                            }
                        ]
                    }
                }
            };

        // 2. Booking Created Flex Card
        case "booking_created":
            return {
                type: "flex",
                altText: `ยืนยันการจองคิว: คิวที่ #${data.queueNumber}`,
                contents: {
                    type: "bubble",
                    header: {
                        type: "box",
                        layout: "vertical",
                        backgroundColor: "#059669",
                        contents: [
                            { type: "text", text: "จองคิวสำเร็จแล้ว!", color: "#FFFFFF", weight: "bold", size: "lg", align: "center" },
                            { type: "text", text: data.bookingType === "test" ? "ทดสอบมาตรฐานฝีมือแรงงาน" : "ฝึกอบรมทักษะอาชีพ", color: "#D1FAE5", size: "xs", align: "center", margin: "xs" }
                        ]
                    },
                    body: {
                        type: "box",
                        layout: "vertical",
                        contents: [
                            {
                                type: "box",
                                layout: "vertical",
                                backgroundColor: "#ECFDF5",
                                paddingAll: "md",
                                cornerRadius: "lg",
                                align: "center",
                                contents: [
                                    { type: "text", text: "หมายเลขคิวของคุณ", size: "xs", color: "#047857" },
                                    { type: "text", text: `คิวที่ #${data.queueNumber}`, size: "xxl", weight: "bold", color: "#059669", align: "center", margin: "xs" }
                                ]
                            },
                            {
                                type: "box",
                                layout: "vertical",
                                margin: "md",
                                contents: [
                                    { type: "text", text: `รายการ: ${data.itemName || "ไม่ระบุ"}`, size: "xs", weight: "bold", wrap: true },
                                    { type: "text", text: `สถานที่: ${data.locationName || "สพร.24 ยะลา"}`, size: "xs", color: "#64748B", margin: "xs", wrap: true }
                                ]
                            }
                        ]
                    },
                    footer: {
                        type: "box",
                        layout: "vertical",
                        contents: [
                            {
                                type: "button",
                                action: { type: "uri", label: "ตรวจสอบสถานะคิว", uri: `${appUrl}/profile` },
                                style: "primary",
                                color: "#059669"
                            }
                        ]
                    }
                }
            };

        // 3. Queue Call / Approaching Flex Card
        case "queue_call":
        case "testing":
        case "training":
            return {
                type: "flex",
                altText: `ถึงคิวของคุณแล้ว! คิวที่ #${data.queueNumber || ""}`,
                contents: {
                    type: "bubble",
                    header: {
                        type: "box",
                        layout: "vertical",
                        backgroundColor: "#D97706",
                        contents: [
                            { type: "text", text: "🔔 ถึงคิวของคุณแล้ว!", color: "#FFFFFF", weight: "bold", size: "lg", align: "center" },
                            { type: "text", text: "กรุณาติดต่อเจ้าหน้าที่ที่จุดบริการ", color: "#FEF3C7", size: "xs", align: "center", margin: "xs" }
                        ]
                    },
                    body: {
                        type: "box",
                        layout: "vertical",
                        contents: [
                            {
                                type: "box",
                                layout: "vertical",
                                backgroundColor: "#FFFBEB",
                                paddingAll: "lg",
                                cornerRadius: "lg",
                                contents: [
                                    { type: "text", text: `หมายเลขคิว: #${data.queueNumber || "-"}`, size: "xl", weight: "bold", color: "#D97706", align: "center" },
                                    { type: "text", text: `บริการ: ${data.itemName || "ไม่ระบุ"}`, size: "xs", color: "#92400E", align: "center", margin: "sm", wrap: true }
                                ]
                            }
                        ]
                    },
                    footer: {
                        type: "box",
                        layout: "vertical",
                        contents: [
                            {
                                type: "button",
                                action: { type: "uri", label: "ดูบัตรคิวดิจิทัล", uri: `${appUrl}/profile` },
                                style: "primary",
                                color: "#D97706"
                            }
                        ]
                    }
                }
            };

        // 4. Appointment Approved Flex Card
        case "appointment":
        case "approved":
            return {
                type: "flex",
                altText: `ยืนยันการนัดหมาย: ${data.itemName || "บริการ"}`,
                contents: {
                    type: "bubble",
                    header: {
                        type: "box",
                        layout: "vertical",
                        backgroundColor: "#2563EB",
                        contents: [
                            { type: "text", text: "📅 ยืนยันนัดหมายสำเร็จ", color: "#FFFFFF", weight: "bold", size: "lg", align: "center" }
                        ]
                    },
                    body: {
                        type: "box",
                        layout: "vertical",
                        contents: [
                            { type: "text", text: `รายการ: ${data.itemName || "ไม่ระบุ"}`, weight: "bold", size: "sm", wrap: true },
                            { type: "text", text: `วันเวลานัดหมาย: ${data.appointedDate || "ตามประกาศสถาบัน"}`, size: "xs", color: "#2563EB", margin: "sm", weight: "bold" },
                            { type: "text", text: `สถานที่: ${data.location || "สถาบันพัฒนาฝีมือแรงงาน 24 ยะลา"}`, size: "xs", color: "#64748B", margin: "xs", wrap: true }
                        ]
                    },
                    footer: {
                        type: "box",
                        layout: "vertical",
                        contents: [
                            {
                                type: "button",
                                action: { type: "uri", label: "ดูข้อมูลนัดหมาย", uri: `${appUrl}/profile` },
                                style: "primary",
                                color: "#2563EB"
                            }
                        ]
                    }
                }
            };

        // 5. Completed Assessment Result
        case "completed":
            return {
                type: "flex",
                altText: `ยินดีด้วย! ผ่านการประเมิน: ${data.itemName || "บริการ"}`,
                contents: {
                    type: "bubble",
                    header: {
                        type: "box",
                        layout: "vertical",
                        backgroundColor: "#7C3AED",
                        contents: [
                            { type: "text", text: "🎉 ผลการประเมิน: ผ่าน", color: "#FFFFFF", weight: "bold", size: "lg", align: "center" }
                        ]
                    },
                    body: {
                        type: "box",
                        layout: "vertical",
                        contents: [
                            { type: "text", text: `ขอแสดงความยินดีด้วย! ท่านผ่านการทดสอบ/ฝึกอบรม`, size: "xs", color: "#64748B", wrap: true },
                            { type: "text", text: `หลักสูตร: ${data.itemName || "ไม่ระบุ"}`, weight: "bold", size: "sm", margin: "sm", wrap: true }
                        ]
                    },
                    footer: {
                        type: "box",
                        layout: "vertical",
                        contents: [
                            {
                                type: "button",
                                action: { type: "uri", label: "ดูวุฒิบัตร/ผลประเมิน", uri: `${appUrl}/profile` },
                                style: "primary",
                                color: "#7C3AED"
                            }
                        ]
                    }
                }
            };

        // Fallback plain text message
        default:
            return {
                type: "text",
                text: `📢 แจ้งเตือนจาก สพร.24 ยะลา\n\n${data.message || data.itemName || "กรุณาตรวจสอบข้อมูลผ่านทางเว็บไซต์"}`
            };
    }
}
