import { prisma } from "@/lib/prisma";
import { EventManagement } from "@/components/dashboard/event-management";
import { UniformManagement } from "@/components/dashboard/uniform-management";
import { NoticeManagement } from "@/components/dashboard/notice-management";

export default async function GestaoPage() {
  const [events, uniforms, notices] = await Promise.all([
    prisma.event.findMany({ orderBy: { startsAt: "asc" } }),
    prisma.uniform.findMany({ orderBy: { name: "asc" } }),
    prisma.notice.findMany({ orderBy: { createdAt: "desc" } }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-semibold text-ink lg:text-4xl">Gestão</h1>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <EventManagement events={events} uniforms={uniforms.map((u) => u.name)} />

        <section className="flex flex-col gap-6">
          <UniformManagement uniforms={uniforms} />
          <NoticeManagement notices={notices} />
        </section>
      </div>
    </div>
  );
}
