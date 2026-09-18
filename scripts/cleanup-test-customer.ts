import { prisma } from "../lib/prisma";

async function main() {
  const deleted = await prisma.customer.deleteMany({
    where: {
      OR: [
        { customerId: "SL-CUST-9999" },
        { primaryMobile: "7722995100" },
      ],
    },
  });
  console.log("DELETED_DUMMY_CUSTOMER_COUNT:", deleted.count);
}

main().finally(async () => {
  await prisma.$disconnect();
});
