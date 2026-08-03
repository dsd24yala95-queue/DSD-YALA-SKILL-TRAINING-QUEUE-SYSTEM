const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createSuperAdmin(phoneNumber, password, fullName = 'Super Admin', department = 'ศูนย์คอมพิวเตอร์และสารสนเทศ') {
    if (!phoneNumber || !password) {
        console.error('Usage: node add_super_admin.js <username_or_phone> <password> [fullName]');
        process.exit(1);
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const existing = await prisma.user.findUnique({ where: { phoneNumber } });

        if (existing) {
            const updated = await prisma.user.update({
                where: { phoneNumber },
                data: {
                    passwordHash: hashedPassword,
                    role: 'admin',
                    fullName: fullName || existing.fullName,
                    department: department || existing.department,
                    status: 'active',
                },
            });
            console.log('Successfully updated Super Admin account:', updated);
        } else {
            const created = await prisma.user.create({
                data: {
                    phoneNumber,
                    passwordHash: hashedPassword,
                    fullName: fullName,
                    role: 'admin',
                    department: department,
                    status: 'active',
                },
            });
            console.log('Successfully created new Super Admin account:', created);
        }
    } catch (error) {
        console.error('Error creating Super Admin:', error);
    } finally {
        await prisma.$disconnect();
    }
}

const args = process.argv.slice(2);
const phoneArg = args[0] || 'superadmin';
const passArg = args[1] || 'SuperAdmin@2026';
const nameArg = args[2] || 'ผู้ดูแลระบบสูงสุด (Super Admin)';

createSuperAdmin(phoneArg, passArg, nameArg);
