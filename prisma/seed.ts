import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const passwordHash = await bcrypt.hash("admin123", 10);

  await prisma.user.upsert({
    where: { email: "admin@voluntarios.com" },
    update: {},
    create: {
      name: "Administrador",
      email: "admin@voluntarios.com",
      passwordHash,
      role: "ADMIN",
    },
  });

  // Development accounts, created only when SEED_TEST_PASSWORD is set (never commit a password here).
  //   SEED_TEST_PASSWORD="..." npx prisma db seed
  const testPassword = process.env.SEED_TEST_PASSWORD;
  if (!testPassword) {
    console.log("SEED_TEST_PASSWORD não definida: contas de teste não foram criadas.");
    return;
  }
  const testHash = await bcrypt.hash(testPassword, 10);

  await prisma.user.upsert({
    where: { email: "admin.teste@voluntarios.com" },
    update: {},
    create: { name: "Admin Teste", email: "admin.teste@voluntarios.com", passwordHash: testHash, role: "ADMIN" },
  });

  await prisma.user.upsert({
    where: { email: "voluntario@voluntarios.com" },
    update: {},
    create: { name: "Voluntário Teste", email: "voluntario@voluntarios.com", passwordHash: testHash, role: "VOLUNTEER" },
  });
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
