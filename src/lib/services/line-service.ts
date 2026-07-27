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
    switch (messageType) {
        case "appointment":
            return {
                type: "text",
                text: `📢 แจ้งเตือนนัดหมายจาก สพร.24 ยะลา\n\nท่านได้รับการอนุมัติคิวและมีนัดหมายในวันที่ ${data.appointedDate || "ไม่ระบุ"} น.\n\nบริการที่จอง: ${data.itemName || "ไม่ระบุ"}\n\nกรุณาเตรียมตัวให้พร้อมและมาตามนัดหมาย\n\nสามารถตรวจสอบข้อมูลเพิ่มเติมได้ที่เว็บไซต์`
            };
        case "completed":
            return {
                type: "text",
                text: `🎉 ยินดีด้วย! ท่านได้ผ่านการประเมินเรียบร้อยแล้ว\n\nรายการ: ${data.itemName || "ไม่ระบุ"}\n\nขอบคุณที่ใช้บริการกับทาง สพร.24 ยะลา`
            };
        case "failed":
            return {
                type: "text",
                text: `❌ ผลการประเมินของท่าน ไม่ผ่าน\n\nรายการ: ${data.itemName || "ไม่ระบุ"}\n\nกรุณาติดต่อเจ้าหน้าที่เพื่อนัดหมายใหม่ หรือตรวจสอบเงื่อนไขเพิ่มเติมผ่านทางเว็บไซต์`
            };
        case "cancellation":
            return {
                type: "text",
                text: `🚫 คิวของท่านถูกยกเลิกแล้ว\n\nรายการ: ${data.itemName || "ไม่ระบุ"}\n\nหากมีข้อสงสัยกรุณาติดต่อสำนักงาน หรือทำรายการจองใหม่ผ่านทางเว็บไซต์`
            };
        case "welcome":
            return {
                type: "text",
                text: `👋 ยินดีต้อนรับสู่ระบบรับสมัครและจองคิว สพร.24 ยะลา!\n\nกรุณาเข้าสู่ระบบผ่านเว็บไซต์และไปที่หน้าโปรไฟล์ เพื่อเชื่อมต่อบัญชี LINE ของท่านเข้ากับระบบ`
            };
        default:
            return null;
    }
}
