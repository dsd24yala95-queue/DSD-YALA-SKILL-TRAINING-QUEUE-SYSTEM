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
    // Checkpoint guard temporarily disabled for standard logins
    return <>{children}</>;
}
