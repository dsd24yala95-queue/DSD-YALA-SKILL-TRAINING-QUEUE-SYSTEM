"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

// Routes that require complete profile
const PROTECTED_MEMBER_ROUTES = [
    "/booking",
    "/profile",
];

export default function ImmigrationCheckpointGuard({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const { user, profile, loading } = useAuth();

    useEffect(() => {
        if (loading) return;

        // Only enforce for logged-in members (not staff/admin)
        if (user && profile) {
            const isStaff = profile.role === "admin" || profile.role === "superadmin" || profile.role === "officer";

            if (!isStaff && pathname !== "/register/complete-profile") {
                const isProtectedRoute = PROTECTED_MEMBER_ROUTES.some(r => pathname.startsWith(r));

                // Require phone number to proceed (profile image is optional / can upload later)
                if (isProtectedRoute && !hasPhone) {
                    router.push("/register/complete-profile");
                }
            }
        }
    }, [user, profile, loading, pathname, router]);

    return <>{children}</>;
}
