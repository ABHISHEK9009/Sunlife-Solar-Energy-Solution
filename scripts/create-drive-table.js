const { PrismaClient } = require('../prisma/generated/client');
const prisma = new PrismaClient();

async function run() {
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "sunlife"."google_drive_configs" (
        "id" VARCHAR(255) PRIMARY KEY DEFAULT 'active',
        "enabled" BOOLEAN DEFAULT true,
        "authMethod" VARCHAR(50) DEFAULT 'OAUTH2',
        "folderId" TEXT,
        "folderName" TEXT DEFAULT 'Sunlife Solar CRM Documents',
        "folderLink" TEXT,
        "accountEmail" TEXT,
        "clientId" TEXT,
        "clientSecret" TEXT,
        "refreshToken" TEXT,
        "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    console.log("Created table sunlife.google_drive_configs successfully!");
  } catch (e) {
    console.error("Error creating table:", e);
  } finally {
    await prisma.$disconnect();
  }
}

run();
