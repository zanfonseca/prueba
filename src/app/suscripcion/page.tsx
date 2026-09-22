import type { Metadata } from "next";
import Link from "next/link";
import { SubscriptionStatus } from "@prisma/client";
import { AccionesSuscripcion } from "@/components/AccionesSuscripcion";
import { requerirUsuario } from "@/lib/auth";
import { diasRestantes, estaActiva } from "@/lib/suscripcion";

export const metadata: Metadata = { title: "Suscripción" };

const ETIQUETAS: Record<SubscriptionStatus, string> = {
  PENDING: "Pendiente de pago",
  ACTIVE: "Activa",
  CANCELLED: "Cancelada (sin renovación automática)",
  EXPIRED: "Vencida",
};

export default async function SuscripcionPage() {
  const usuario = await requerirUsuario();
  const suscripcion = usuario.subscription;
  const activa = estaActiva(suscripcion);

  return (
    <main className="mx-auto max-w-xl px-6 py-12">
      <Link href="/panel" className="text-sm text-blue-600 hover:underline">
        ← Volver al panel
      </Link>

      <h1 className="mt-4 text-2xl font-semibold">Suscripción mensual</h1>
      <p className="mt-2 text-sm text-black/70 dark:text-white/70">
        Acceso completo por 30 días con renovación automática mediante MercadoPago. Puedes cancelar
        cuando quieras y conservas el acceso hasta el vencimiento.
      </p>

      <section className="mt-6 rounded-2xl border border-black/10 p-6 dark:border-white/15">
        <dl className="mb-6 space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-black/60 dark:text-white/60">Estado</dt>
            <dd>{suscripcion ? ETIQUETAS[suscripcion.status] : "Sin suscripción"}</dd>
          </div>
          {suscripcion?.currentPeriodEnd ? (
            <div className="flex justify-between">
              <dt className="text-black/60 dark:text-white/60">Vence</dt>
              <dd>
                {suscripcion.currentPeriodEnd.toLocaleDateString("es-AR")} ·{" "}
                {diasRestantes(suscripcion)} días
              </dd>
            </div>
          ) : null}
        </dl>

        <AccionesSuscripcion activa={activa} />
      </section>
    </main>
  );
}
