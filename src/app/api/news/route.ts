import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkStaffAuth } from "@/lib/auth-guard";

const NEWS_SETTING_KEY = "system_news_announcements";

// Default initial news items
const DEFAULT_NEWS = [
    {
        id: "news-1",
        title: "เปิดรับสมัครฝึกอบรมยกระดับฝีมือแรงงาน สาขาช่างติดตั้งแผงโซลาร์เซลล์",
        category: "training",
        categoryLabel: "ข่าวฝึกอบรม",
        date: "2026-07-25",
        summary: "สพร.24 ยะลา เปิดรับสมัครผู้สนใจเข้าร่วมการฝึกอบรมฟรี! หลักสูตรการติดตั้งและบำรุงรักษาระบบโซลาร์เซลล์สำหรับที่อยู่อาศัย",
        content: `สถาบันพัฒนาฝีมือแรงงาน 24 ยะลา ประกาศเปิดรับสมัครบุคคลทั่วไปและช่างไฟฟ้า เข้าร่วมโครงการฝึกอบรมยกระดับฝีมือแรงงาน สาขา "การติดตั้งและบำรุงรักษาระบบโซลาร์เซลล์" ระดับ 1

ระยะเวลาฝึกอบรม: 30 ชั่วโมง (5 วัน)
สถานที่ฝึกอบรม: อาคารฝึกอบรมเทคโนโลยีพลังงาน สพร.24 ยะลา
คุณสมบัติผู้สมัคร:
1. อายุ 18 ปีขึ้นไป
2. มีความรู้พื้นฐานงานไฟฟ้าหรือผ่านการทดสอบมาตรฐานฝีมือแรงงานไฟฟ้าในอาคาร
3. ไม่เสียค่าใช้จ่ายใดๆ ทั้งสิ้น พร้อมเบี้ยเลี้ยงตามเกณฑ์โครงการ`,
        image: "https://images.unsplash.com/photo-1508873696983-2df515122519?auto=format&fit=crop&q=80&w=800",
        badgeColor: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
        pinned: true,
        status: "active",
        createdAt: new Date().toISOString(),
    },
    {
        id: "news-2",
        title: "กำหนดการทดสอบมาตรฐานฝีมือแรงงานแห่งชาติ สาขาช่างไฟฟ้าภายในอาคาร ระดับ 1",
        category: "testing",
        categoryLabel: "ข่าวทดสอบมาตรฐาน",
        date: "2026-07-20",
        summary: "แจ้งกำหนดการทดสอบภาคความรู้และภาคความสามารถ สำหรับผู้ที่ลงทะเบียนรอบเดือนสิงหาคม 2026",
        content: `สถาบันพัฒนาฝีมือแรงงาน 24 ยะลา ขอแจ้งกำหนดการทดสอบมาตรฐานฝีมือแรงงานแห่งชาติ สาขาช่างไฟฟ้าภายในอาคาร ระดับ 1 ประจำรอบเดือนสิงหาคม 2026

กำหนดการทดสอบ:
- ภาคความรู้ (ข้อเขียนระบบ E-Testing): วันเสาร์ที่ 10 สิงหาคม 2026 เวลา 09.00 - 10.30 น.
- ภาคความสามารถ (ปฏิบัติจริง): วันอาทิตย์ที่ 11 สิงหาคม 2026 เวลา 08.30 - 16.30 น.

สถานที่ทดสอบ: ศูนย์ทดสอบมาตรฐานฝีมือแรงงาน อาคารช่างไฟฟ้า สพร.24 ยะลา`,
        image: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&q=80&w=800",
        badgeColor: "bg-blue-500/10 text-blue-600 border-blue-500/20",
        pinned: false,
        status: "active",
        createdAt: new Date().toISOString(),
    },
    {
        id: "news-3",
        title: "สพร.24 ยะลา จัดกิจกรรมส่งเสริมโอกาสการมีงานทำในพื้นที่จังหวัดชายแดนภาคใต้",
        category: "general",
        categoryLabel: "ข่าวประชาสัมพันธ์",
        date: "2026-07-15",
        summary: "บูรณาการร่วมกับสถานประกอบการในพื้นที่จังหวัดยะลา ปัตตานี และนราธิวาส เพื่อรองรับแรงงานฝีมือที่ผ่านการทดสอบมาตรฐาน",
        content: `สถาบันพัฒนาฝีมือแรงงาน 24 ยะลา เดินหน้าสร้างความร่วมมือกับสภาอุตสาหกรรม และหอการค้ากลุ่มจังหวัดภาคใต้ชายแดน จัดกิจกรรมนัดพบแรงงานฝีมือ (Skill Matching)`,
        image: "https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&q=80&w=800",
        badgeColor: "bg-purple-500/10 text-purple-600 border-purple-500/20",
        pinned: false,
        status: "active",
        createdAt: new Date().toISOString(),
    },
];

async function getStoredNews() {
    try {
        const setting = await prisma.systemSetting.findUnique({
            where: { key: NEWS_SETTING_KEY },
        });
        if (setting && setting.value) {
            return JSON.parse(setting.value);
        }
    } catch (e) {
        console.error("Failed to read news from SystemSetting:", e);
    }
    return DEFAULT_NEWS;
}

async function saveNews(newsList: any[]) {
    await prisma.systemSetting.upsert({
        where: { key: NEWS_SETTING_KEY },
        update: { value: JSON.stringify(newsList) },
        create: { key: NEWS_SETTING_KEY, value: JSON.stringify(newsList) },
    });
}

// GET /api/news — Public and Staff endpoint
export async function GET(req: Request) {
    try {
        const news = await getStoredNews();
        return NextResponse.json(news, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST /api/news — Staff creating news
export async function POST(req: Request) {
    try {
        const { errorResponse } = await checkStaffAuth();
        if (errorResponse) return errorResponse;

        const body = await req.json();
        const { title, category, summary, content, image, pinned } = body;

        if (!title || !category || !content) {
            return NextResponse.json({ error: "กรุณากรอกหัวข้อ หมวดหมู่ และเนื้อหาข่าว" }, { status: 400 });
        }

        const resolveBadge = (cat: string) => {
            if (cat === "training") return { label: "ข่าวฝึกอบรม", color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" };
            if (cat === "testing") return { label: "ข่าวทดสอบมาตรฐาน", color: "bg-blue-500/10 text-blue-600 border-blue-500/20" };
            return { label: "ข่าวประชาสัมพันธ์", color: "bg-purple-500/10 text-purple-600 border-purple-500/20" };
        };

        const badge = resolveBadge(category);
        const newNewsItem = {
            id: `news-${Date.now()}`,
            title,
            category,
            categoryLabel: badge.label,
            date: new Date().toISOString().split("T")[0],
            summary: summary || title,
            content,
            image: image || "https://images.unsplash.com/photo-1508873696983-2df515122519?auto=format&fit=crop&q=80&w=800",
            badgeColor: badge.color,
            pinned: !!pinned,
            status: "active",
            createdAt: new Date().toISOString(),
        };

        const list = await getStoredNews();
        const updatedList = [newNewsItem, ...list];
        await saveNews(updatedList);

        return NextResponse.json(newNewsItem, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// PUT /api/news — Staff updating news or pin status
export async function PUT(req: Request) {
    try {
        const { errorResponse } = await checkStaffAuth();
        if (errorResponse) return errorResponse;

        const body = await req.json();
        const { id, title, category, summary, content, image, pinned, status } = body;

        if (!id) {
            return NextResponse.json({ error: "Missing news ID" }, { status: 400 });
        }

        const resolveBadge = (cat: string) => {
            if (cat === "training") return { label: "ข่าวฝึกอบรม", color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" };
            if (cat === "testing") return { label: "ข่าวทดสอบมาตรฐาน", color: "bg-blue-500/10 text-blue-600 border-blue-500/20" };
            return { label: "ข่าวประชาสัมพันธ์", color: "bg-purple-500/10 text-purple-600 border-purple-500/20" };
        };

        const list = await getStoredNews();
        let updatedItem: any = null;

        const updatedList = list.map((item: any) => {
            if (item.id === id) {
                const badge = resolveBadge(category || item.category);
                updatedItem = {
                    ...item,
                    title: title ?? item.title,
                    category: category ?? item.category,
                    categoryLabel: badge.label,
                    summary: summary ?? item.summary,
                    content: content ?? item.content,
                    image: image ?? item.image,
                    badgeColor: badge.color,
                    pinned: pinned !== undefined ? pinned : item.pinned,
                    status: status ?? item.status,
                    updatedAt: new Date().toISOString(),
                };
                return updatedItem;
            }
            return item;
        });

        if (!updatedItem) {
            return NextResponse.json({ error: "ไม่พบข่าวประกาศที่ระบุ" }, { status: 404 });
        }

        await saveNews(updatedList);
        return NextResponse.json(updatedItem, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE /api/news — Staff deleting news
export async function DELETE(req: Request) {
    try {
        const { errorResponse } = await checkStaffAuth();
        if (errorResponse) return errorResponse;

        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({ error: "Missing news ID" }, { status: 400 });
        }

        const list = await getStoredNews();
        const updatedList = list.filter((item: any) => item.id !== id);
        await saveNews(updatedList);

        return NextResponse.json({ success: true, message: "ลบข่าวประกาศเรียบร้อยแล้ว" }, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
