"use client";

import React from "react";
import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BottomNav from "@/components/BottomNav";
import PwaInstallPrompt from "@/components/PwaInstallPrompt";

export default function LayoutContent({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const isAdminRoute = pathname.startsWith("/admin") || pathname === "/login/admin";

    if (isAdminRoute) {
        // Return without padding and outer styles for admin layouts
        return <>{children}</>;
    }

    return (
        <div className="pb-16 md:pb-0 min-h-screen flex flex-col">
            <Navbar />
            <main className="flex-1">{children}</main>
            <Footer />
            <BottomNav />
            <PwaInstallPrompt />
        </div>
    );
}
