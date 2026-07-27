const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function seedAdmin() {
  const adminPhone = 'admin';
  const adminPassword = 'admin'; // You can change this
  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  try {
    const existingAdmin = await prisma.user.findUnique({
      where: { phoneNumber: adminPhone }
    });

    if (existingAdmin) {
      console.log('Admin already exists.');
      return;
    }

    const adminUser = await prisma.user.create({
      data: {
        phoneNumber: adminPhone,
        passwordHash: hashedPassword,
        fullName: 'Administrator',
        role: 'admin',
      }
    });

    console.log('Admin user created successfully:', adminUser);
  } catch (error) {
    console.error('Error seeding admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedAdmin();
