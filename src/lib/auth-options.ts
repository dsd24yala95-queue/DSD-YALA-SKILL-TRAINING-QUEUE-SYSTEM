import { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

// ─── Session Policy ──────────────────────────────────────────────────────────
// • maxAge  = 1 ชั่วโมง  (token หมดอายุถ้าไม่ active)
// • NO updateAge          (ไม่ต่ออายุอัตโนมัติ — หมด 1 ชั่วโมงต้อง login ใหม่)
// • loginAt timestamp     (บังคับ re-login หลัง 8 ชั่วโมง นับจากครั้งแรกที่ login)
// • Cookie ไม่มี maxAge  (ปิด Browser → cookie หาย → ต้อง login ใหม่ทุกครั้ง)
// ─────────────────────────────────────────────────────────────────────────────

const MAX_SESSION_SECONDS = 1 * 60 * 60;        // 1 ชั่วโมง
const FORCE_RELOGIN_SECONDS = 8 * 60 * 60;      // 8 ชั่วโมง (1 วันทำงาน)

export const authOptions: AuthOptions = {
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                phoneNumber: { label: "Phone Number", type: "text" },
                password: { label: "Password", type: "password" },
                isThaID: { label: "Is ThaID", type: "text" },
                pid: { label: "PID", type: "text" },
                fullName: { label: "Full Name", type: "text" },
            },
            async authorize(credentials) {
                // 🇹🇭 Handle ThaID Login
                if (credentials?.isThaID === "true") {
                    const pid = credentials.pid || "1959900" + Math.floor(100000 + Math.random() * 900000);
                    const fullName = credentials.fullName || "ผู้สมัครยืนยันตัวตน ThaID";

                    let user = await prisma.user.findFirst({
                        where: { idCard: pid }
                    });

                    if (!user) {
                        const tempPhone = "08" + Math.floor(10000000 + Math.random() * 90000000);
                        user = await prisma.user.create({
                            data: {
                                idCard: pid,
                                fullName: fullName,
                                phoneNumber: tempPhone,
                                passwordHash: "THAID_AUTH_OAUTH",
                                role: "member",
                            }
                        });
                        // Clear phone number so ImmigrationCheckpointGuard detects incomplete profile and redirects to /register/complete-profile!
                        user = await prisma.user.update({
                            where: { id: user.id },
                            data: { phoneNumber: "" }
                        });
                    }

                    return {
                        id: user.id,
                        phoneNumber: user.phoneNumber,
                        email: user.email,
                        name: user.fullName || pid,
                        idCard: user.idCard || pid,
                        role: user.role,
                        department: user.department,
                        mustChangePassword: user.mustChangePassword,
                    };
                }

                if (!credentials?.phoneNumber) {
                    throw new Error("กรุณากรอกเบอร์โทรศัพท์");
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

                // สมาชิกทั่วไป (role === "member"): เข้าสู่ระบบด้วยเบอร์โทรศัพท์อย่างเดียว ไม่ต้องตรวจรหัสผ่าน
                // เจ้าหน้าที่/ผู้ดูแลระบบ (role !== "member"): ตรวจสอบรหัสผ่านเฉพาะเมื่อล็อกอินผ่านหน้าแอดมิน
                if (user.role !== "member" && credentials?.password) {
                    const isValid = await bcrypt.compare(credentials.password, user.passwordHash);
                    if (!isValid) {
                        throw new Error("รหัสผ่านไม่ถูกต้อง");
                    }
                }

                return {
                    id: user.id,
                    phoneNumber: user.phoneNumber,
                    email: user.email,
                    name: user.fullName || user.phoneNumber,
                    idCard: user.idCard,
                    role: user.role,
                    department: user.department,
                    mustChangePassword: user.mustChangePassword,
                };
            }
        })
    ],
    callbacks: {
        async jwt({ token, user }) {
            // เมื่อ login ครั้งแรก — บันทึกเวลา login ลงใน token
            if (user) {
                token.id = user.id;
                token.role = (user as any).role;
                token.department = (user as any).department;
                token.phoneNumber = (user as any).phoneNumber;
                token.idCard = (user as any).idCard;
                token.mustChangePassword = (user as any).mustChangePassword;
                token.loginAt = Math.floor(Date.now() / 1000); // Unix timestamp (วินาที)
            }

            // Force re-login: ถ้า login มานานเกิน FORCE_RELOGIN_SECONDS → ยกเลิก token
            if (token.loginAt) {
                const now = Math.floor(Date.now() / 1000);
                const ageSeconds = now - (token.loginAt as number);
                if (ageSeconds > FORCE_RELOGIN_SECONDS) {
                    // คืน null จะทำให้ NextAuth ถือว่า session ไม่ valid → redirect login
                    return { ...token, expired: true };
                }
            }

            return token;
        },
        async session({ session, token }) {
            // ถ้า token ถูกบังคับหมดอายุ → คืน session ว่างเพื่อให้ middleware จับได้
            if ((token as any).expired) {
                return { ...session, user: undefined as any, expires: new Date(0).toISOString() };
            }

            if (session.user) {
                (session.user as any).id = token.id as string;
                (session.user as any).role = token.role as string;
                (session.user as any).department = token.department as string;
                (session.user as any).phoneNumber = token.phoneNumber;
                (session.user as any).idCard = token.idCard;
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
        maxAge: MAX_SESSION_SECONDS,
        // ❌ ไม่มี updateAge → token ไม่ต่ออายุอัตโนมัติ
    },
    jwt: {
        maxAge: MAX_SESSION_SECONDS,
    },
    cookies: {
        sessionToken: {
            name: process.env.NODE_ENV === "production"
                ? "__Secure-next-auth.session-token"
                : "next-auth.session-token",
            options: {
                httpOnly: true,
                sameSite: "lax",
                path: "/",
                secure: process.env.NODE_ENV === "production",
                // ❌ ไม่มี maxAge → เป็น Session Cookie (ปิด Browser แล้วหาย)
            },
        },
    },
    secret: process.env.NEXTAUTH_SECRET || "your-secret-key-for-dev",
};
