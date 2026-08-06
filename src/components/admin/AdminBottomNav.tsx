"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const adminNavItems = [
  { href: "/admin", label: "แดชบอร์ด", icon: "fa-chart-pie" },
  { href: "/admin/queue", label: "จัดการคิว", icon: "fa-list-check" },
  { href: "/admin/walkin", label: "Walk-in", icon: "fa-person-walking-arrow-right" },
  { href: "/admin/news", label: "ข่าวสาร", icon: "fa-newspaper" },
];

export default function AdminBottomNav({ onOpenDrawer }: { onOpenDrawer?: () => void }) {
  const pathname = usePathname();

  const isLinkActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden print:hidden">
      <div className="bg-[#0F172A]/95 dark:bg-[#0F172A]/95 backdrop-blur-2xl border-t border-slate-700/60 shadow-[0_-10px_30px_rgba(0,0,0,0.4)] px-3 py-2 flex items-center justify-around h-16 safe-bottom">
        {adminNavItems.map((item, index) => {
          const active = isLinkActive(item.href);

          return (
            <Link
              key={index}
              href={item.href}
              className={`relative flex flex-col items-center justify-center flex-1 py-1 text-center transition-all active:scale-95 ${
                active
                  ? "text-indigo-400 font-bold scale-105"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <i className={`fa-solid ${item.icon} text-base mb-1`}></i>
              <span className="text-[10px] tracking-wide">{item.label}</span>
              {active && (
                <span className="absolute bottom-0 w-1.5 h-1.5 bg-indigo-400 rounded-full shadow-[0_0_8px_#818cf8]"></span>
              )}
            </Link>
          );
        })}

        {/* Menu Drawer Toggle Button */}
        <button
          type="button"
          onClick={() => {
            if (onOpenDrawer) {
              onOpenDrawer();
            } else {
              // Fallback dispatch custom event to open AdminSidebar drawer
              window.dispatchEvent(new CustomEvent("open-admin-drawer"));
            }
          }}
          className="relative flex flex-col items-center justify-center flex-1 py-1 text-center text-slate-400 hover:text-slate-200 transition-all active:scale-95"
        >
          <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-300 flex items-center justify-center mb-0.5 border border-indigo-400/30">
            <i className="fa-solid fa-bars text-xs"></i>
          </div>
          <span className="text-[10px] tracking-wide">เมนูทั้งหมด</span>
        </button>
      </div>
    </div>
  );
}
