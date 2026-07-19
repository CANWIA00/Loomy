import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const ADMIN_KEYS = [
  "ADMIN-ABC1",
  "ADMIN-ABC2",
  "ADMIN-ABC3",
  "ADMIN-ABC4",
  "ADMIN-ABC5",
];

async function main() {
  console.log("🌱 Seeding admin keys...");

  for (const key of ADMIN_KEYS) {
    const existing = await prisma.adminKey.findUnique({
      where: { keyValue: key },
    });

    if (!existing) {
      await prisma.adminKey.create({
        data: { keyValue: key },
      });
      console.log(`  ✅ Created: ${key}`);
    } else {
      console.log(`  ⏭️  Already exists: ${key}`);
    }
  }

  console.log("🎉 Seed completed!");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
