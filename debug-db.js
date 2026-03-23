const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkClientAccess() {
  const clients = await prisma.firmClient.findMany({
    include: {
      FirmClientAccess: true
    }
  });
  console.log(JSON.stringify(clients, null, 2));
  await prisma.$disconnect();
}

checkClientAccess();
