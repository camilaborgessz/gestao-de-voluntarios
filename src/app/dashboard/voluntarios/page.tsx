import { prisma } from "@/lib/prisma";
import { UserManagement } from "@/components/dashboard/user-management";

export default async function VoluntariosPage() {
  const users = await prisma.user.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, email: true, phone: true, birthDate: true, role: true },
  });

  return <UserManagement users={users} />;
}
