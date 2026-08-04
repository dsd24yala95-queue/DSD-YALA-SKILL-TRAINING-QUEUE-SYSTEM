import { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const authOptions: AuthOptions = {
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                phoneNumber: { label: "Phone Number", type: "text" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials?.phoneNumber || !credentials?.password) {
                    throw new Error("กรุณากรอกเบอร์โทรศัพท์และรหัสผ่าน");
                }

                const user = await prisma.user.findUnique({
                    where: { phoneNumber: credentials.phoneNumber }
                });

                if (!user) {
                    throw new Error("ไม่พบประวัติผู้ใช้งานหรือเบอร์โทรศัพท์นี้");
                }

                if (user.status === "inactive") {
                    throw new Error("บัญชีของคุณถูกระงับการใช้งาน กรุณาติดต่อ Super Admin");
                }

                const isValid = await bcrypt.compare(credentials.password, user.passwordHash);

                if (!isValid) {
                    throw new Error("รหัสผ่านไม่ถูกต้อง");
                }

                return {
                    id: user.id,
                    phoneNumber: user.phoneNumber,
                    email: user.email,
                    name: user.fullName || user.phoneNumber,
                    role: user.role,
                    department: user.department,
                    mustChangePassword: user.mustChangePassword,
                };
            }
        })
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.role = (user as any).role;
                token.department = (user as any).department;
                token.phoneNumber = (user as any).phoneNumber;
                token.mustChangePassword = (user as any).mustChangePassword;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                (session.user as any).id = token.id as string;
                (session.user as any).role = token.role as string;
                (session.user as any).department = token.department as string;
                (session.user as any).phoneNumber = token.phoneNumber;
                (session.user as any).mustChangePassword = Boolean(token.mustChangePassword);
            }
            return session;
        }
    },
    pages: {
        signIn: "/login",
    },
    session: {
        strategy: "jwt",
        maxAge: 1 * 60 * 60, // 1 Hour (3,600 seconds)
        updateAge: 15 * 60,  // Auto sliding refresh every 15 minutes while active
    },
    jwt: {
        maxAge: 1 * 60 * 60, // 1 Hour
    },
    cookies: {
        sessionToken: {
            name: process.env.NODE_ENV === "production" ? "__Secure-next-auth.session-token" : "next-auth.session-token",
            options: {
                httpOnly: true,
                sameSite: "lax",
                path: "/",
                secure: process.env.NODE_ENV === "production",
                maxAge: 1 * 60 * 60, // 1 Hour Cookie Expiry
            },
        },
    },
    secret: process.env.NEXTAUTH_SECRET || "your-secret-key-for-dev",
};
