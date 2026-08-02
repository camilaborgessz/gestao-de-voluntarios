import { Plus, Trash2, Pencil } from "lucide-react";
import { EventManageRow, type EventManageRowProps } from "@/components/dashboard/event-manage-row";
import { NoticesCard, type Notice } from "@/components/dashboard/notices-card";

const events: EventManageRowProps[] = [
  { date: "06/02", weekday: "Seg", time: "18:30", title: "Culto de Ensino", tags: ["Saia preta", "Blusa branca", "Lenço Florido"] },
  { date: "06/02", weekday: "Seg", time: "18:30", title: "Culto de Ensino", tags: ["Saia preta", "Blusa branca", "Lenço Florido"] },
  { date: "06/02", weekday: "Seg", time: "18:30", title: "Culto de Ensino", tags: ["Saia preta", "Blusa branca", "Lenço Florido"] },
  { date: "06/02", weekday: "Seg", time: "18:30", title: "Culto de Ensino", tags: ["Saia preta", "Blusa branca", "Lenço Florido"] },
  { date: "06/02", weekday: "Seg", time: "18:30", title: "Culto de Ensino", tags: ["Saia preta", "Blusa branca", "Lenço Florido"] },
];

const uniforms = ["Roupa preta", "Lenço Florido", "Roupa preta", "Lenço Florido", "Roupa preta", "Lenço Florido", "Roupa preta", "Lenço Florido"];

const notices: Notice[] = [
  {
    message: "A escala da recepção para o culto da noite ainda possui 2 vagas abertas.",
    postedAt: "16/03/26",
    author: "Vanessa",
  },
  {
    message: "A escala da recepção para o culto da noite ainda possui 2 vagas abertas.",
    postedAt: "16/03/26",
    author: "Vanessa",
  },
];

function AddButton({ label }: { label: string }) {
  return (
    <button
      title={label}
      className="flex size-6 items-center justify-center rounded-full bg-gradient-to-b from-lime-from to-lime-to text-brand hover:brightness-95"
    >
      <Plus size={14} strokeWidth={2.5} />
    </button>
  );
}

export default function GestaoPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-semibold text-ink lg:text-4xl">Gestão</h1>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <section>
          <div className="mb-4 flex items-center gap-2">
            <h2 className="text-xl font-medium text-ink lg:text-2xl">Eventos</h2>
            <span className="flex size-6 items-center justify-center rounded-full bg-lime-from/70 text-xs font-medium text-brand lg:size-7 lg:text-sm">
              {events.length}
            </span>
            <AddButton label="Novo evento" />
          </div>

          <div className="flex flex-col gap-4 rounded-[10px] bg-white p-5 shadow-[0_4px_37px_rgba(0,0,0,0.1)]">
            {events.map((event, index) => (
              <EventManageRow key={index} {...event} />
            ))}

            <button className="self-end text-xs font-medium text-ink hover:underline">Ver mais</button>
          </div>
        </section>

        <section className="flex flex-col gap-6">
          <div>
            <div className="mb-4 flex items-center gap-2">
              <h2 className="text-xl font-medium text-ink lg:text-2xl">Uniformes</h2>
              <AddButton label="Novo uniforme" />
            </div>

            <div className="grid grid-cols-1 gap-3 rounded-[10px] bg-gradient-to-r from-brand to-brand-dark p-5 shadow-[0_4px_17px_rgba(0,0,0,0.25)] sm:grid-cols-2">
              {uniforms.map((label, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between gap-2 rounded-full bg-gradient-to-r from-white to-bg px-4 py-2"
                >
                  <span className="truncate text-sm font-semibold text-ink">{label}</span>
                  <div className="flex shrink-0 items-center gap-2 text-ink/70">
                    <button title="Apagar" className="hover:text-ink">
                      <Trash2 size={16} />
                    </button>
                    <button title="Editar" className="hover:text-ink">
                      <Pencil size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-4 flex items-center gap-2">
              <h2 className="text-xl font-medium text-ink lg:text-2xl">Avisos</h2>
              <AddButton label="Novo aviso" />
            </div>
            <NoticesCard notices={notices} editable />
          </div>
        </section>
      </div>
    </div>
  );
}
