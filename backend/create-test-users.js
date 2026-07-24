const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash("test1234", 10);

  const existing = await prisma.user.findUnique({ where: { email: "test@user.com" } });
  if (!existing) {
    const company = await prisma.company.create({ data: { name: "Test Sirketi", invitationCode: "INVITE-TEST1" } });
    await prisma.user.create({ data: { name: "Test User", email: "test@user.com", phone: "05551112233", password: hash, role: "USER", inviteCode: "INVITE-TEST1", companyId: company.id } });
    console.log("USER olusturuldu: test@user.com / test1234");
  } else {
    console.log("USER zaten var: test@user.com");
  }

  const existingAdmin = await prisma.user.findUnique({ where: { email: "test@admin.com" } });
  if (!existingAdmin) {
    const adminCompany = await prisma.company.create({ data: { name: "Test Admin Sirketi", invitationCode: "INVITE-TEST2" } });
    await prisma.user.create({ data: { name: "Test Admin", email: "test@admin.com", phone: "05553334455", password: hash, role: "ADMIN", inviteCode: "ADMIN-ABC1", companyId: adminCompany.id } });
    console.log("ADMIN olusturuldu: test@admin.com / test1234");
  } else {
    console.log("ADMIN zaten var: test@admin.com");
  }
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
