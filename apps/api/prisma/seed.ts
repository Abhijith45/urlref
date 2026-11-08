import { PrismaClient, UserRole } from '@prisma/client';
import argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // 1. Create Demo Admin User
  const adminPasswordHash = await argon2.hash('Admin@123456');
  const admin = await prisma.user.upsert({
    where: { email: 'admin@softics.in' },
    update: {},
    create: {
      email: 'admin@softics.in',
      passwordHash: adminPasswordHash,
      role: UserRole.ADMIN,
    },
  });
  console.log(`✓ Admin user created/verified: ${admin.email}`);

  // 2. Create Demo Normal User
  const demoPasswordHash = await argon2.hash('Demo@123456');
  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@softics.in' },
    update: {},
    create: {
      email: 'demo@softics.in',
      passwordHash: demoPasswordHash,
      role: UserRole.USER,
    },
  });
  console.log(`✓ Demo user created/verified: ${demoUser.email}`);

  // 3. Create Sample Links for demoUser
  const githubLink = await prisma.link.upsert({
    where: { code: 'github' },
    update: {},
    create: {
      userId: demoUser.id,
      code: 'github',
      destinationUrl: 'https://github.com',
      isActive: true,
    },
  });

  const googleLink = await prisma.link.upsert({
    where: { code: 'google' },
    update: {},
    create: {
      userId: demoUser.id,
      code: 'google',
      destinationUrl: 'https://www.google.com',
      isActive: true,
    },
  });

  const docsLink = await prisma.link.upsert({
    where: { code: 'docs' },
    update: {},
    create: {
      userId: demoUser.id,
      code: 'docs',
      destinationUrl: 'https://developer.mozilla.org',
      isActive: true,
    },
  });

  console.log(`✓ Seeded sample links: github, google, docs`);

  // 4. Seed realistic Click Events for analytics preview
  const sampleEvents = [
    { linkId: githubLink.id, deviceType: 'desktop', referrer: 'twitter.com', countryCode: 'US' },
    { linkId: githubLink.id, deviceType: 'desktop', referrer: 'linkedin.com', countryCode: 'IN' },
    { linkId: githubLink.id, deviceType: 'mobile', referrer: 't.co', countryCode: 'US' },
    { linkId: githubLink.id, deviceType: 'mobile', referrer: 'reddit.com', countryCode: 'GB' },
    { linkId: githubLink.id, deviceType: 'tablet', referrer: 'google.com', countryCode: 'DE' },
    { linkId: googleLink.id, deviceType: 'desktop', referrer: 'news.ycombinator.com', countryCode: 'US' },
    { linkId: googleLink.id, deviceType: 'mobile', referrer: 'facebook.com', countryCode: 'IN' },
    { linkId: docsLink.id, deviceType: 'desktop', referrer: 'stackoverflow.com', countryCode: 'US' },
  ];

  for (let i = 0; i < sampleEvents.length; i++) {
    const event = sampleEvents[i];
    // Spread clicks over the last 7 days
    const clickedAt = new Date(Date.now() - (i % 7) * 24 * 60 * 60 * 1000);
    await prisma.clickEvent.create({
      data: {
        linkId: event.linkId,
        deviceType: event.deviceType,
        referrer: event.referrer,
        countryCode: event.countryCode,
        clickedAt,
      },
    });
  }

  console.log(`✓ Seeded sample click events for analytics`);
  console.log('🌱 Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
