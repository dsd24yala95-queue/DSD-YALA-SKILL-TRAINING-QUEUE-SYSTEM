"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "หน้าแรก", icon: "fa-house" },
  { href: "/training", label: "หลักสูตร", icon: "fa-graduation-cap" },
  { href: "/testing", label: "สาขาทดสอบ", icon: "fa-building-columns" },
  { href: "/notifications", label: "แจ้งเตือน", icon: "fa-bell", isNotifications: true },
  { href: "/profile", label: "โปรไฟล์", icon: "fa-user" }
];

import { useAuth } from "@/context/AuthContext";

export default function BottomNav() {
  const pathname = usePathname();
  const { profile } = useAuth();
  const [unreadCount, setUnreadCount] = React.useState(0);

  React.useEffect(() => {
    if (!profile?.uid) return;
    const fetchNotifications = async () => {
      try {
        const res = await fetch(`/api/notifications?userId=${profile.uid}`);
        if (res.ok) {
          const data = await res.json();
          setUnreadCount(data.filter((n: any) => !n.read).length);
        }
      } catch (e) {}
    };
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, [profile?.uid]);
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      {/* Background glass effect with top border */}
      <div className="bg-white/70 dark:bg-black/70 backdrop-blur-2xl border-t border-white/20 dark:border-white/5 shadow-[0_-10px_30px_rgba(0,0,0,0.1)] px-4 py-2 flex items-center justify-around h-16 safe-bottom">
        {navItems.map((item, index) => {
          const isActive = pathname === item.href;

          return (
            <Link
              key={index}
              href={item.href}
              className={`relative flex flex-col items-center justify-center flex-1 py-1 text-center transition-all active:scale-95 ${
                isActive
                  ? "text-[#2563EB] dark:text-[#60A5FA] font-semibold scale-105"
                  : "text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400"
              }`}
            >
              <i className={`fa-solid ${item.icon} text-lg mb-0.5`}></i>
              <span className="text-[10px] tracking-wide">{item.label}</span>
              
              {/* Active Dot */}
              {isActive && (
                <span className="absolute bottom-0 w-1 h-1 bg-[#2563EB] dark:bg-[#60A5FA] rounded-full"></span>
              )}

              {/* Notification Badge */}
              {item.isNotifications && unreadCount > 0 && (
                <span className="absolute top-0 right-5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
