"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";

interface UserProfile {
    uid: string;
    email: string | null;
    fullName?: string;
    phoneNumber?: string;
    role?: string;
    idCard?: string;
    lineUserId?: string;
    memberId?: string;
    profileJson?: string;
}

interface AuthContextType {
    user: any | null; // NextAuth user
    profile: UserProfile | null;
    loading: boolean;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    profile: null,
    loading: true,
    logout: async () => { },
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const { data: session, status } = useSession();
    const [profile, setProfile] = useState<UserProfile | null>(null);

    useEffect(() => {
        let mounted = true;

        async function fetchProfile(userId: string) {
            try {
                const res = await fetch(`/api/users?id=${userId}`);
                if (res.ok && mounted) {
                    const data = await res.json();
                    if (data) {
                        setProfile({
                            uid: data.id,
                            email: data.email || null,
                            role: data.role,
                            phoneNumber: data.phoneNumber,
                            memberId: data.memberId,
                            fullName: data.fullName,
                            profileJson: data.profileJson,
                            idCard: data.idCard
                        });
                    }
                }
            } catch (err) {
                console.error("Failed to fetch full profile", err);
            }
        }

        if (session?.user) {
            // Set initial data from session for fast render
            setProfile({
                uid: session.user.id,
                email: session.user.email || null,
                role: session.user.role,
                phoneNumber: session.user.phoneNumber,
                memberId: session.user.memberId,
                fullName: session.user.name || undefined
            });
            // Fetch the rest of the profile from database
            fetchProfile(session.user.id);
        } else {
            setProfile(null);
        }

        return () => {
            mounted = false;
        };
    }, [session, status]);

    const logout = async () => {
        await signOut({ redirect: false });
    };

    return (
        <AuthContext.Provider value={{
            user: session?.user || null,
            profile,
            loading: status === "loading",
            logout
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);