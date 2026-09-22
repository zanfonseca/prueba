import type { Metadata } from "next";
import Link from "next/link";
import { requerirUsuario } from "@/lib/auth";
import { estaActiva } from "@/lib/suscripcion";
import { Alerta, Tarjeta } from "@/components/ui";

export const metadata: Metadata = { title: "Resultado del pago" };

export default async function ResultadoPage() {
  const usuario = await requerirUsuario();
  const activa = estaActiva(usuario.subscription);

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-12">
      <Tarjeta titulo="Gracias por suscribirte">
        {activa ? (
          <Alerta tipo="ok">Tu suscripción ya está activa por 30 días.</Alerta>
        ) : (
          <Alerta tipo="error">
            Estamos confirmando el pago con MercadoPago. Puede tardar unos minutos: recarga esta
            página o revisa tu panel más tarde.
          </Alerta>
        )}

        <Link href="/panel" className="text-blue-600 hover:underline">
          Ir a mi panel
        </Link>
      </Tarjeta>
    </main>
  );
}
