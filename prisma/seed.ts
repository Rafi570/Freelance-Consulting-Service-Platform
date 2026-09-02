import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

const prisma = new PrismaClient();

async function main() {
  const email = 'hasan.rafi0123@gmail.com';
  const hashedPassword = await bcrypt.hash('password123', 10);

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    console.log('ℹ️ User already exists in database:', existingUser.email);
    return;
  }

  const user = await prisma.user.create({
    data: {
      name: 'Hasan Rafi',
      email,
      password: hashedPassword,
      role: 'CLIENT',
      status: 'ACTIVE',
    },
  });

  console.log('✅ User successfully created in PostgreSQL database:');
  console.log({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
  });
}

main()
  .catch((e) => {
    console.error('❌ Error creating user:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
