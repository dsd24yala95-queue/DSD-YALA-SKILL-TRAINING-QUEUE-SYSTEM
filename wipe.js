process.env.DATABASE_URL = "file:./dev.db";
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
    datasourceUrl: process.env.DATABASE_URL
});

async function main() {
    await prisma.notification.deleteMany();
    await prisma.queueBooking.deleteMany();
    await prisma.user.deleteMany({
        where: { role: 'member' }
    });
    console.log("Wiped all members, bookings, and notifications.");
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
