import Link from "next/link";
import Image from "next/image";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 p-8 text-center">
      <Image src="/logo.png" alt="Koinonia" width={200} height={67} priority />
      <h1 className="text-3xl font-semibold text-ink">Gestão de Voluntários</h1>
      <p className="max-w-md text-ink/70">
        Plataforma para organizar projetos, oportunidades e voluntários.
      </p>
      <Link
        href="/login"
        className="rounded-full border border-brand-dark bg-brand px-6 py-2.5 font-semibold text-white hover:bg-brand-dark"
      >
        Entrar
      </Link>
    </main>
  );
}
