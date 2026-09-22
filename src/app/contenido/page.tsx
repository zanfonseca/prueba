import type { Metadata } from "next";
import Link from "next/link";
import { requerirUsuario } from "@/lib/auth";
import { diasRestantes, estaActiva } from "@/lib/suscripcion";

export const metadata: Metadata = { title: "Contenido exclusivo" };

export default async function ContenidoPage() {
  const usuario = await requerirUsuario();

  if (!estaActiva(usuario.subscription)) {
    return (
      <main className="mx-auto max-w-xl px-6 py-12">
        <h1 className="text-2xl font-semibold">Contenido solo para suscriptores</h1>
        <p className="mt-2 text-sm text-black/70 dark:text-white/70">
          Tu suscripción no está activa. Actívala para ver esta sección.
        </p>
        <Link
          href="/suscripcion"
          className="mt-6 inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Activar suscripción
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-xl px-6 py-12">
      <h1 className="text-2xl font-semibold">Contenido exclusivo</h1>
      <p className="mt-2 text-sm text-black/70 dark:text-white/70">
        Acceso habilitado por {diasRestantes(usuario.subscription)} días. Reemplaza esta página por
        el contenido de tu sitio.
      </p>
    </main>
  );
}
