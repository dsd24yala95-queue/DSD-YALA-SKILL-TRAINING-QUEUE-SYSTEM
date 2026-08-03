import NextAuth, { AuthOptions } from "next-auth";
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
                    name: user.fullName,
                    role: user.role,
                    memberId: user.memberId
                };
            }
        })
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.role = user.role;
                token.phoneNumber = user.phoneNumber;
                token.memberId = user.memberId;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id as string;
                session.user.role = token.role as string;
                session.user.phoneNumber = token.phoneNumber as string;
                session.user.memberId = token.memberId as string | undefined;
            }
            return session;
        }
    },
    pages: {
        signIn: "/login",
    },
    session: {
        strategy: "jwt",
    },
    secret: process.env.NEXTAUTH_SECRET || "your-secret-key-for-dev",
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
