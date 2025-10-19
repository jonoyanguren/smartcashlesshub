import { PrismaClient, PaymentMethod, PaymentStatus, EventStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Helper function to generate random date within event duration
function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

// Helper function to generate random payment amount
function randomAmount(min: number, max: number): number {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}

// Helper function to get random item from array
function randomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

async function main() {
  console.log('🌱 Starting seed...');

  // Get the existing tenant (Club Beso)
  const tenant = await prisma.tenant.findFirst({
    where: { slug: 'club-beso' },
  });

  if (!tenant) {
    throw new Error('Tenant not found. Please ensure Club Beso tenant exists.');
  }

  console.log(`📍 Using tenant: ${tenant.name}`);

  // Clean existing payments, events, and end users
  console.log('🧹 Cleaning existing seed data...');
  await prisma.payment.deleteMany({});
  await prisma.event.deleteMany({ where: { tenantId: tenant.id } });
  await prisma.user.deleteMany({ where: { globalRole: 'END_USER' } });

  // Create 100 fake end users
  console.log('👥 Creating 100 end users...');
  const users = [];
  const hashedPassword = await bcrypt.hash('password123', 10);

  for (let i = 1; i <= 100; i++) {
    const user = await prisma.user.create({
      data: {
        email: `customer${i}@example.com`,
        firstName: `Customer`,
        lastName: `${i}`,
        phone: `+34 ${600000000 + i}`,
        password: hashedPassword,
        globalRole: 'END_USER',
        tenants: {
          create: {
            tenantId: tenant.id,
            role: 'END_USER',
          },
        },
      },
    });
    users.push(user);
  }

  console.log(`✅ Created ${users.length} end users`);

  // Create events with different statuses
  console.log('📅 Creating events...');

  const now = new Date();
  const events = [];

  // Event 1: COMPLETED - Last month (lots of payments)
  const event1Start = new Date(now.getFullYear(), now.getMonth() - 1, 15, 22, 0, 0);
  const event1End = new Date(now.getFullYear(), now.getMonth() - 1, 16, 5, 0, 0);
  const event1 = await prisma.event.create({
    data: {
      name: 'Noche de Verano',
      description: 'Una noche increíble con los mejores DJs',
      location: 'Sala Principal',
      address: 'Calle Mayor 123, Madrid',
      startDate: event1Start,
      endDate: event1End,
      status: 'COMPLETED',
      capacity: 500,
      tenantId: tenant.id,
    },
  });
  events.push(event1);

  // Event 2: COMPLETED - 2 weeks ago (moderate payments)
  const event2Start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 14, 23, 0, 0);
  const event2End = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 13, 6, 0, 0);
  const event2 = await prisma.event.create({
    data: {
      name: 'Fiesta Tropical',
      description: 'Cócteles y música latina',
      location: 'Terraza',
      address: 'Calle Mayor 123, Madrid',
      startDate: event2Start,
      endDate: event2End,
      status: 'COMPLETED',
      capacity: 300,
      tenantId: tenant.id,
    },
  });
  events.push(event2);

  // Event 3: ACTIVE - Happening now (payments in real-time)
  const event3Start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours() - 2, 0, 0);
  const event3End = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours() + 4, 0, 0);
  const event3 = await prisma.event.create({
    data: {
      name: 'Viernes de Electrónica',
      description: 'La mejor música electrónica en directo',
      location: 'Sala Principal',
      address: 'Calle Mayor 123, Madrid',
      startDate: event3Start,
      endDate: event3End,
      status: 'ACTIVE',
      capacity: 600,
      tenantId: tenant.id,
    },
  });
  events.push(event3);

  // Event 4: SCHEDULED - Next weekend
  const event4Start = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7, 23, 30, 0);
  const event4End = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 8, 6, 0, 0);
  const event4 = await prisma.event.create({
    data: {
      name: 'Noche de Reggaeton',
      description: 'Los mejores éxitos del momento',
      location: 'Sala VIP',
      address: 'Calle Mayor 123, Madrid',
      startDate: event4Start,
      endDate: event4End,
      status: 'SCHEDULED',
      capacity: 400,
      tenantId: tenant.id,
    },
  });
  events.push(event4);

  // Event 5: DRAFT - Planning
  const event5Start = new Date(now.getFullYear(), now.getMonth() + 1, 5, 22, 0, 0);
  const event5End = new Date(now.getFullYear(), now.getMonth() + 1, 6, 4, 0, 0);
  const event5 = await prisma.event.create({
    data: {
      name: 'Festival de Primavera',
      description: 'Evento especial de fin de mes',
      location: 'Todo el local',
      address: 'Calle Mayor 123, Madrid',
      startDate: event5Start,
      endDate: event5End,
      status: 'DRAFT',
      capacity: 800,
      tenantId: tenant.id,
    },
  });
  events.push(event5);

  // Event 6: COMPLETED - 3 months ago (some payments)
  const event6Start = new Date(now.getFullYear(), now.getMonth() - 3, 10, 23, 0, 0);
  const event6End = new Date(now.getFullYear(), now.getMonth() - 3, 11, 5, 0, 0);
  const event6 = await prisma.event.create({
    data: {
      name: 'Aniversario Club Beso',
      description: 'Celebramos 5 años de música',
      location: 'Sala Principal + Terraza',
      address: 'Calle Mayor 123, Madrid',
      startDate: event6Start,
      endDate: event6End,
      status: 'COMPLETED',
      capacity: 700,
      tenantId: tenant.id,
    },
  });
  events.push(event6);

  console.log(`✅ Created ${events.length} events`);

  // Generate payments for each event
  console.log('💰 Generating payments...');

  const paymentMethods: PaymentMethod[] = ['BRACELET', 'CARD', 'CASH', 'WALLET'];
  const paymentMethodWeights = [0.7, 0.15, 0.1, 0.05]; // 70% bracelet, 15% card, 10% cash, 5% wallet

  let totalPayments = 0;

  // Helper to get weighted random payment method
  function getRandomPaymentMethod(): PaymentMethod {
    const random = Math.random();
    let cumulative = 0;
    for (let i = 0; i < paymentMethods.length; i++) {
      cumulative += paymentMethodWeights[i];
      if (random < cumulative) {
        return paymentMethods[i];
      }
    }
    return 'BRACELET';
  }

  // Event 1 (COMPLETED - last month): 200 payments
  console.log(`  💳 Event 1 (${event1.name}): Generating 200 payments...`);
  for (let i = 0; i < 200; i++) {
    const paidAt = randomDate(event1Start, event1End);
    await prisma.payment.create({
      data: {
        amount: randomAmount(5, 50),
        currency: 'EUR',
        paymentMethod: getRandomPaymentMethod(),
        status: Math.random() > 0.02 ? 'COMPLETED' : 'REFUNDED', // 2% refunded
        paidAt,
        eventId: event1.id,
        userId: randomItem(users).id,
        tenantId: tenant.id,
        metadata: {
          description: 'Event purchase',
          items: [
            { name: 'Drinks', quantity: Math.floor(Math.random() * 3) + 1 },
          ],
        },
      },
    });
    totalPayments++;
  }

  // Event 2 (COMPLETED - 2 weeks ago): 120 payments
  console.log(`  💳 Event 2 (${event2.name}): Generating 120 payments...`);
  for (let i = 0; i < 120; i++) {
    const paidAt = randomDate(event2Start, event2End);
    await prisma.payment.create({
      data: {
        amount: randomAmount(5, 40),
        currency: 'EUR',
        paymentMethod: getRandomPaymentMethod(),
        status: Math.random() > 0.03 ? 'COMPLETED' : 'REFUNDED',
        paidAt,
        eventId: event2.id,
        userId: randomItem(users).id,
        tenantId: tenant.id,
        metadata: {
          description: 'Event purchase',
          items: [
            { name: 'Cocktails', quantity: Math.floor(Math.random() * 2) + 1 },
          ],
        },
      },
    });
    totalPayments++;
  }

  // Event 3 (ACTIVE - now): 80 payments (ongoing)
  console.log(`  💳 Event 3 (${event3.name}): Generating 80 payments (ACTIVE)...`);
  for (let i = 0; i < 80; i++) {
    const paidAt = randomDate(event3Start, now);
    const isPending = Math.random() < 0.1; // 10% pending
    await prisma.payment.create({
      data: {
        amount: randomAmount(5, 60),
        currency: 'EUR',
        paymentMethod: getRandomPaymentMethod(),
        status: isPending ? 'PENDING' : 'COMPLETED',
        paidAt: isPending ? null : paidAt,
        eventId: event3.id,
        userId: randomItem(users).id,
        tenantId: tenant.id,
        metadata: {
          description: 'Event purchase',
          items: [
            { name: 'Entry + Drinks', quantity: 1 },
          ],
        },
      },
    });
    totalPayments++;
  }

  // Event 4 (SCHEDULED): No payments yet

  // Event 5 (DRAFT): No payments yet

  // Event 6 (COMPLETED - 3 months ago): 150 payments
  console.log(`  💳 Event 6 (${event6.name}): Generating 150 payments...`);
  for (let i = 0; i < 150; i++) {
    const paidAt = randomDate(event6Start, event6End);
    await prisma.payment.create({
      data: {
        amount: randomAmount(10, 70),
        currency: 'EUR',
        paymentMethod: getRandomPaymentMethod(),
        status: Math.random() > 0.01 ? 'COMPLETED' : 'REFUNDED',
        paidAt,
        eventId: event6.id,
        userId: randomItem(users).id,
        tenantId: tenant.id,
        metadata: {
          description: 'Anniversary event purchase',
          items: [
            { name: 'Special package', quantity: 1 },
          ],
        },
      },
    });
    totalPayments++;
  }

  console.log(`✅ Created ${totalPayments} payments`);

  console.log('\n✨ Seed completed successfully!');
  console.log('\n📊 Summary:');
  console.log(`  - Tenant: ${tenant.name}`);
  console.log(`  - Users: ${users.length}`);
  console.log(`  - Events: ${events.length}`);
  console.log(`  - Payments: ${totalPayments}`);
  console.log('\n💡 You can now view the statistics in the dashboard!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });