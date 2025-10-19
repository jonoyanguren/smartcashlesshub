// Script to list all tenants with their details
// Usage: make list-tenants

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('📋 Fetching all tenants...\n');

  const tenants = await prisma.tenant.findMany({
    include: {
      users: {
        include: {
          user: {
            select: {
              email: true,
              firstName: true,
              lastName: true,
              globalRole: true,
            },
          },
        },
      },
      events: {
        select: {
          id: true,
          name: true,
          status: true,
        },
      },
      _count: {
        select: {
          users: true,
          events: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  if (tenants.length === 0) {
    console.log('No tenants found.');
    return;
  }

  console.log(`Found ${tenants.length} tenant(s):\n`);
  console.log('═'.repeat(80));

  tenants.forEach((tenant, index) => {
    const status = tenant.isActive ? '✅ Active' : '❌ Inactive';

    console.log(`\n${index + 1}. ${tenant.name}`);
    console.log('─'.repeat(80));
    console.log(`   ID:           ${tenant.id}`);
    console.log(`   Slug:         ${tenant.slug}`);
    console.log(`   Status:       ${status}`);
    console.log(`   Contact:      ${tenant.contactEmail || 'N/A'}`);
    console.log(`   Phone:        ${tenant.contactPhone || 'N/A'}`);
    console.log(`   Users:        ${tenant._count.users}`);
    console.log(`   Events:       ${tenant._count.events}`);
    console.log(`   Created:      ${tenant.createdAt.toLocaleDateString()}`);

    if (tenant.users.length > 0) {
      console.log(`\n   👥 Users:`);
      tenant.users.forEach((tu) => {
        const name = tu.user.firstName && tu.user.lastName
          ? `${tu.user.firstName} ${tu.user.lastName}`
          : 'N/A';
        console.log(`      • ${tu.user.email} (${name}) - Role: ${tu.role}`);
      });
    }

    if (tenant.events.length > 0) {
      console.log(`\n   📅 Recent Events:`);
      tenant.events.slice(0, 3).forEach((event) => {
        console.log(`      • ${event.name} - ${event.status}`);
      });
      if (tenant.events.length > 3) {
        console.log(`      ... and ${tenant.events.length - 3} more`);
      }
    }
  });

  console.log('\n' + '═'.repeat(80));
  console.log(`\nTotal: ${tenants.length} tenant(s)`);
  console.log(`Active: ${tenants.filter(t => t.isActive).length}`);
  console.log(`Inactive: ${tenants.filter(t => !t.isActive).length}`);
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });