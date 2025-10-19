// Script to activate or deactivate a tenant
// Usage: make deactivate-tenant SLUG=club-name
//        make activate-tenant SLUG=club-name

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const slug = process.env.SLUG;
  const action = process.env.ACTION; // 'activate' or 'deactivate'

  if (!slug) {
    console.error('❌ Missing required parameter: SLUG');
    console.error('Usage: make deactivate-tenant SLUG=club-name');
    console.error('       make activate-tenant SLUG=club-name');
    process.exit(1);
  }

  if (!action || !['activate', 'deactivate'].includes(action)) {
    console.error('❌ Invalid ACTION. Must be "activate" or "deactivate"');
    process.exit(1);
  }

  const isActive = action === 'activate';

  console.log(`${isActive ? '✅' : '❌'} ${isActive ? 'Activating' : 'Deactivating'} tenant...`);
  console.log(`🔗 Slug: ${slug}`);

  try {
    // Find tenant
    const tenant = await prisma.tenant.findUnique({
      where: { slug },
      include: {
        _count: {
          select: {
            users: true,
            events: true,
          },
        },
      },
    });

    if (!tenant) {
      console.error(`❌ Tenant with slug "${slug}" not found!`);
      process.exit(1);
    }

    // Update tenant status
    const updatedTenant = await prisma.tenant.update({
      where: { slug },
      data: { isActive },
    });

    console.log(`\n✅ Tenant ${isActive ? 'activated' : 'deactivated'} successfully!`);
    console.log(`   Name: ${updatedTenant.name}`);
    console.log(`   Slug: ${updatedTenant.slug}`);
    console.log(`   Status: ${updatedTenant.isActive ? '✅ Active' : '❌ Inactive'}`);
    console.log(`   Users: ${tenant._count.users}`);
    console.log(`   Events: ${tenant._count.events}`);

    if (!isActive) {
      console.log('\n⚠️  Note: Users from this tenant will not be able to log in.');
      console.log('⚠️  Events from this tenant will not be accessible.');
    }
  } catch (error: any) {
    console.error('❌ Error:', error.message);
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