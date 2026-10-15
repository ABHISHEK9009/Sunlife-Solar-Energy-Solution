const { PrismaClient } = require('../prisma/generated/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const tables = await prisma.$queryRawUnsafe(`
      SELECT table_schema, table_name FROM information_schema.tables WHERE table_schema NOT IN ('pg_catalog', 'information_schema');
    `);
    console.log("TABLES:", JSON.stringify(tables, null, 2));

    const driveConfig = await prisma.$queryRawUnsafe(`
      SELECT * FROM "sunlife"."google_drive_configs";
    `);
    console.log("DRIVE_CONFIG_TABLE:", JSON.stringify(driveConfig, null, 2));
  } catch (err) {
    console.error("QUERY_ERROR:", err.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
