import { PrismaClient } from '@prisma/client';

async function main() {
  console.log('Instantiating PrismaClient...');
  const prisma = new PrismaClient();
  console.log('PrismaClient instantiated.');

  console.log('Connecting to database...');
  await prisma.$connect();
  console.log('Connected successfully.');

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error('Error:', e);
  process.exit(1);
});
