// Script to create a test user with a test tenant
// Usage: npx ts-node scripts/create-test-user.ts

import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🔨 Creating test user and tenant...');

  // Create test tenant
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'test-club' },
    update: {},
    create: {
      name: 'Test Club',
      slug: 'test-club',
      description: 'Test club for development',
      contactEmail: 'contact@test-club.com',
      isActive: true,
    },
  });
  console.log('✅ Tenant created:', tenant.name);

  // Hash password
  const hashedPassword = await bcrypt.hash('password123', 10);

  // Create test user
  const user = await prisma.user.upsert({
    where: { email: 'test@test.com' },
    update: {
      password: hashedPassword,
    },
    create: {
      email: 'test@test.com',
      password: hashedPassword,
      firstName: 'Test',
      lastName: 'User',
      globalRole: UserRole.TENANT_ADMIN,
      isActive: true,
    },
  });
  console.log('✅ User created:', user.email);

  // Link user to tenant
  const tenantUser = await prisma.tenantUser.upsert({
    where: {
      userId_tenantId: {
        userId: user.id,
        tenantId: tenant.id,
      },
    },
    update: {},
    create: {
      userId: user.id,
      tenantId: tenant.id,
      role: UserRole.TENANT_ADMIN,
    },
  });
  console.log('✅ User linked to tenant with role:', tenantUser.role);

  console.log('\n📋 Test credentials:');
  console.log('   Email: test@test.com');
  console.log('   Password: password123');
  console.log('   Tenant: test-club');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });