// Script to create a SUPERADMIN user
// Usage: make create-superadmin EMAIL=admin@example.com PASSWORD=secure123 FIRST_NAME=Admin LAST_NAME=User

import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Get parameters from environment or use defaults
  const email = process.env.EMAIL || 'admin@smartcashless.com';
  const password = process.env.PASSWORD || 'admin123';
  const firstName = process.env.FIRST_NAME || 'Super';
  const lastName = process.env.LAST_NAME || 'Admin';

  console.log('🔨 Creating SUPERADMIN user...');
  console.log(`📧 Email: ${email}`);

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create or update SUPERADMIN
  const user = await prisma.user.upsert({
    where: { email },
    update: {
      password: hashedPassword,
      globalRole: UserRole.SUPERADMIN,
      isActive: true,
    },
    create: {
      email,
      password: hashedPassword,
      firstName,
      lastName,
      globalRole: UserRole.SUPERADMIN,
      isActive: true,
    },
  });

  console.log('✅ SUPERADMIN created successfully!');
  console.log('\n📋 Login credentials:');
  console.log(`   Email: ${email}`);
  console.log(`   Password: ${password}`);
  console.log(`   Role: ${user.globalRole}`);
  console.log('\n⚠️  IMPORTANT: Change the password after first login!');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });