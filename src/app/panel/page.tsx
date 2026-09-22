import type { Metadata } from "next";
import Link from "next/link";
import { requerirUsuario } from "@/lib/auth";
import { BotonCerrarSesion } from "@/components/BotonCerrarSesion";
import { diasRestantes, estaActiva } from "@/lib/suscripcion";

export const metadata: Metadata = { title: "Mi panel" };

export default async function PanelPage() {
  const usuario = await requerirUsuario();
  const activa = estaActiva(usuario.subscription);
  const dias = diasRestantes(usuario.subscription);

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <header className="mb-10 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Hola, {usuario.nombre}</h1>
          <p className="text-sm text-black/60 dark:text-white/60">{usuario.email}</p>
        </div>
        <BotonCerrarSesion />
      </header>

      <section className="rounded-2xl border border-black/10 p-6 dark:border-white/15">
        <h2 className="text-lg font-medium">Estado de la suscripción</h2>

        {activa ? (
          <p className="mt-2 text-sm">
            Activa · vence el{" "}
            {usuario.subscription?.currentPeriodEnd?.toLocaleDateString("es-AR")} ({dias} días
            restantes).
          </p>
        ) : (
          <p className="mt-2 text-sm">
            Sin suscripción activa. Actívala para entrar al contenido exclusivo.
          </p>
        )}

        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href="/suscripcion"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            {activa ? "Administrar suscripción" : "Suscribirme"}
          </Link>
          <Link
            href="/contenido"
            className="rounded-lg border border-black/15 px-4 py-2 text-sm hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10"
          >
            Contenido exclusivo
          </Link>
        </div>
      </section>
    </main>
  );
}
