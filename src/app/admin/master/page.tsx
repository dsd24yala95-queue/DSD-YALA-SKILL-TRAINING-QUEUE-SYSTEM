"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminMasterRedirect() {
    const router = useRouter();

    useEffect(() => {
        router.replace("/admin/training");
    }, [router]);

    return (
        <div className="py-24 flex flex-col items-center justify-center min-h-[60vh] gap-3">
            <span className="loading loading-spinner loading-lg text-indigo-600"></span>
            <p className="text-xs text-slate-400 font-medium">กำลังไปยังระบบจัดการการฝึกอบรม...</p>
        </div>
    );
}
