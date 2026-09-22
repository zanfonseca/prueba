import type { Metadata } from "next";
import Link from "next/link";
import { FormularioRestablecer } from "@/components/FormularioRestablecer";
import { Alerta, Tarjeta } from "@/components/ui";

export const metadata: Metadata = { title: "Nueva contraseña" };

export default async function RestablecerPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-12">
      <Tarjeta titulo="Nueva contraseña">
        {token ? (
          <FormularioRestablecer token={token} />
        ) : (
          <>
            <Alerta tipo="error">El enlace no es válido o está incompleto.</Alerta>
            <Link href="/recuperar" className="text-blue-600 hover:underline">
              Solicitar un enlace nuevo
            </Link>
          </>
        )}
      </Tarjeta>
    </main>
  );
}
