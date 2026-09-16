import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('password123', 10);

  // 1. Seed Super Admin (Requested by user)
  const superAdminEmail = 'hasanrafi570@gmail.com';
  const superAdminPassword = await bcrypt.hash('Rafi570@', 10);
  const superAdmin = await prisma.user.upsert({
    where: { email: superAdminEmail },
    update: {
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
      password: superAdminPassword,
    },
    create: {
      name: 'Hasan Rafi (Super Admin)',
      email: superAdminEmail,
      password: superAdminPassword,
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
    },
  });
  console.log('👑 Super Admin configured:', superAdmin.email, '| Role:', superAdmin.role, '| Status:', superAdmin.status);

  // 1b. Default Platform Super Admin
  const adminEmail = 'superadmin@platform.com';
  let admin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!admin) {
    admin = await prisma.user.create({
      data: {
        name: 'Platform Super Admin',
        email: adminEmail,
        password: hashedPassword,
        role: 'SUPER_ADMIN',
        status: 'ACTIVE',
      },
    });
    console.log('✅ Super Admin created:', admin.email);
  } else {
    console.log('ℹ️ Super Admin already exists:', admin.email);
  }

  // 2. Seed Client
  const clientEmail = 'hasan.rafi0123@gmail.com';
  let client = await prisma.user.findUnique({
    where: { email: clientEmail },
  });

  if (!client) {
    client = await prisma.user.create({
      data: {
        name: 'Hasan Rafi',
        email: clientEmail,
        password: hashedPassword,
        role: 'CLIENT',
        status: 'ACTIVE',
      },
    });
    console.log('✅ Client created:', client.email);
  } else {
    console.log('ℹ️ Client already exists:', client.email);
  }

  // 3. Seed Provider
  const providerEmail = 'hasan.provider@gmail.com';
  let provider = await prisma.user.findUnique({
    where: { email: providerEmail },
  });

  if (!provider) {
    provider = await prisma.user.create({
      data: {
        name: 'Hasan Provider',
        email: providerEmail,
        password: hashedPassword,
        role: 'PROVIDER',
        status: 'ACTIVE',
        profile: {
          create: {
            bio: 'Senior Full Stack & Cloud Specialist',
            skills: ['React', 'Node.js', 'PostgreSQL', 'Prisma', 'Docker'],
            hourlyRate: 50,
            phone: '+8801700000001',
            address: 'Dhaka, Bangladesh',
            experience: '5+ years',
          },
        },
      },
    });
    console.log('✅ Provider created:', provider.email);
  } else {
    console.log('ℹ️ Provider already exists:', provider.email);
  }

  console.log('\n--- Seed Summary ---');
  console.log('👑 Super Admin: hasanrafi570@gmail.com / Rafi570@');
  console.log('👑 Super Admin: superadmin@platform.com / password123');
  console.log('💼 Provider:    hasan.provider@gmail.com / password123');
  console.log('👤 Client:      hasan.rafi0123@gmail.com / password123');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
