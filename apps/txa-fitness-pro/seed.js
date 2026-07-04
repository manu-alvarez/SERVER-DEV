const { PrismaClient } = require('@prisma/client');
const { hash } = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await hash("password123", 10);
  
  const user = await prisma.user.upsert({
    where: { email: 'test@txafitness.com' },
    update: {},
    create: {
      email: 'test@txafitness.com',
      name: 'Test User',
      passwordHash,
      profile: {
        create: {
          displayName: 'Test User',
        }
      }
    },
  });
  console.log({ user });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
