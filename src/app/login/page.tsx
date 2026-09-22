import type { Metadata } from "next";
import { FormularioLogin } from "@/components/FormularioLogin";
import { Tarjeta } from "@/components/ui";

export const metadata: Metadata = { title: "Iniciar sesión" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ restablecida?: string }>;
}) {
  const { restablecida } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-12">
      <Tarjeta titulo="Iniciar sesión">
        <FormularioLogin avisoRestablecida={restablecida === "1"} />
      </Tarjeta>
    </main>
  );
}
