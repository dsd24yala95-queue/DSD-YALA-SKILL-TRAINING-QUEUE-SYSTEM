import { NextResponse } from "next/server";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const text = searchParams.get("text");

    if (!text || typeof text !== "string") {
        return NextResponse.json({ error: "Missing or invalid text parameter" }, { status: 400 });
    }

    try {
        const cleanText = text.trim();
        const encodedText = encodeURIComponent(cleanText);
        const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodedText}&tl=th&client=tw-ob`;

        const res = await fetch(ttsUrl, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            },
        });

        if (!res.ok) {
            throw new Error(`Google TTS response status: ${res.status}`);
        }

        const audioBuffer = await res.arrayBuffer();

        return new Response(audioBuffer, {
            headers: {
                "Content-Type": "audio/mpeg",
                "Cache-Control": "public, max-age=86400",
            },
        });
    } catch (error: any) {
        console.error("[TTS API Error]:", error);
        return NextResponse.json({ error: error.message || "Failed to stream TTS audio" }, { status: 500 });
    }
}
