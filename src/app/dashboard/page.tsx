import { auth } from "@/auth";
import { EventCard, type EventCardProps } from "@/components/dashboard/event-card";
import { VerseCard } from "@/components/dashboard/verse-card";
import { NoticesCard, type Notice } from "@/components/dashboard/notices-card";

const upcomingEvents: EventCardProps[] = [
  {
    date: "06/02",
    weekday: "Seg",
    time: "18:30",
    title: "Culto de Ensino",
    tags: ["Saia preta", "Lenço Florido", "Blusa branca"],
    filled: 2,
    capacity: 10,
  },
  {
    date: "07/02",
    weekday: "Seg",
    time: "18:30",
    title: "Culto de Ensino",
    tags: ["Roupa preta", "Lenço vermelho"],
    filled: 6,
    capacity: 10,
  },
  {
    date: "08/02",
    weekday: "Seg",
    time: "18:30",
    title: "Culto de Ensino",
    tags: ["Uniforme azul"],
    filled: 10,
    capacity: 10,
  },
  {
    date: "07/02",
    weekday: "Seg",
    time: "18:30",
    title: "Culto de Ensino",
    tags: ["Roupa preta", "Lenço vermelho"],
    filled: 2,
    capacity: 10,
  },
];

const notices: Notice[] = [
  {
    message:
      "A escala da recepção para o culto da noite ainda possui 2 vagas abertas.",
    postedAt: "16/03/26",
    author: "Vanessa",
  },
  {
    message:
      "A escala da recepção para o culto da noite ainda possui 2 vagas abertas.",
    postedAt: "16/03/26",
    author: "Vanessa",
  },
];

export default async function DashboardPage() {
  const session = await auth();
  const firstName = session?.user?.name?.split(" ")[0] ?? "voluntário(a)";
  const isAdmin = session?.user?.role ? session.user.role === "ADMIN" : true;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-2xl text-brand lg:text-3xl">Bem-vindo (a), {firstName}</p>
        <h1 className="text-3xl font-semibold text-ink lg:text-4xl">
          Como está sua agenda hoje?
        </h1>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <section className="lg:col-span-2">
          <div className="mb-4 flex items-center gap-2">
            <h2 className="text-xl font-medium text-ink lg:text-2xl">Próximos eventos</h2>
            <span className="flex size-6 items-center justify-center rounded-full bg-lime-from/70 text-xs font-medium text-brand lg:size-7 lg:text-sm">
              {upcomingEvents.length}
            </span>
          </div>

          <div className="flex flex-col gap-4 rounded-[10px] bg-white p-5 shadow-[0_4px_37px_rgba(0,0,0,0.1)]">
            {upcomingEvents.map((event, index) => (
              <EventCard key={index} {...event} isAdmin={isAdmin} />
            ))}

            <button className="self-end rounded-full bg-lime-from/40 px-5 py-1.5 text-xs font-medium text-ink hover:bg-lime-from/60 lg:text-sm">
              Ver mais
            </button>
          </div>
        </section>

        <section className="flex flex-col gap-6">
          <div>
            <h2 className="mb-4 text-xl font-medium text-ink lg:text-2xl">
              Versículo do dia
            </h2>
            <VerseCard
              verse="Não fui eu que ordenei a você? Seja forte e corajoso! Não se apavore nem desanime, pois o Senhor, o seu Deus, estará com você por onde você andar"
              reference="Josué 1:9"
            />
          </div>

          <div>
            <h2 className="mb-4 text-xl font-medium text-ink lg:text-2xl">Avisos</h2>
            <NoticesCard notices={notices} />
          </div>
        </section>
      </div>
    </div>
  );
}
