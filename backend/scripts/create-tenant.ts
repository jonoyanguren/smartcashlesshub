// Script to create a new tenant with an admin user
// Usage: make create-tenant NAME="Club Name" SLUG=club-name EMAIL=admin@club.com PASSWORD=secure123

import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Get parameters from environment (required)
  const name = process.env.NAME;
  const slug = process.env.SLUG;
  const email = process.env.EMAIL;
  const password = process.env.PASSWORD || 'changeme123';

  // Optional parameters
  const description = process.env.DESCRIPTION;
  const contactEmail = process.env.CONTACT_EMAIL;
  const contactPhone = process.env.CONTACT_PHONE;

  // Validation
  if (!name || !slug || !email) {
    console.error('❌ Missing required parameters!');
    console.error('Usage: make create-tenant NAME="Club Name" SLUG=club-name EMAIL=admin@club.com');
    process.exit(1);
  }

  console.log('🔨 Creating new tenant...');
  console.log(`📋 Name: ${name}`);
  console.log(`🔗 Slug: ${slug}`);

  try {
    // Create tenant
    const tenant = await prisma.tenant.create({
      data: {
        name,
        slug,
        description,
        contactEmail: contactEmail || email,
        contactPhone,
        isActive: true,
      },
    });
    console.log('✅ Tenant created:', tenant.name);

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create admin user for this tenant
    const user = await prisma.user.upsert({
      where: { email },
      update: {
        password: hashedPassword,
      },
      create: {
        email,
        password: hashedPassword,
        firstName: name.split(' ')[0],
        lastName: 'Admin',
        globalRole: UserRole.TENANT_ADMIN,
        isActive: true,
      },
    });
    console.log('✅ Admin user created:', user.email);

    // Link user to tenant
    const tenantUser = await prisma.tenantUser.create({
      data: {
        userId: user.id,
        tenantId: tenant.id,
        role: UserRole.TENANT_ADMIN,
      },
    });
    console.log('✅ User linked to tenant with role:', tenantUser.role);

    console.log('\n📋 Tenant created successfully!');
    console.log(`   Tenant: ${tenant.name} (${tenant.slug})`);
    console.log(`   Admin: ${email}`);
    console.log(`   Password: ${password}`);
    console.log(`   URL: http://localhost:5173/${tenant.slug}`);
    console.log('\n⚠️  Send these credentials to the tenant admin!');
  } catch (error: any) {
    if (error.code === 'P2002') {
      console.error('❌ Error: Tenant slug or email already exists!');
    } else {
      console.error('❌ Error:', error.message);
    }
    process.exit(1);
  }
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });