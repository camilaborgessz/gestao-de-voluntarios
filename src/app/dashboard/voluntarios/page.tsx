import { requireAdminPage } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { UserManagement } from "@/components/dashboard/user-management";

export default async function VoluntariosPage() {
  await requireAdminPage();
  const rows = await prisma.user.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, email: true, phone: true, birthDate: true, role: true, passwordHash: true },
  });
  // The hash never leaves the server: the screen only learns whether the person already chose a password.
  const users = rows.map(({ passwordHash, ...user }) => ({ ...user, pending: passwordHash === null }));

  return <UserManagement users={users} />;
}
