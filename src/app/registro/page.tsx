import type { Metadata } from "next";
import { FormularioRegistro } from "@/components/FormularioRegistro";
import { Tarjeta } from "@/components/ui";

export const metadata: Metadata = { title: "Crear cuenta" };

export default function RegistroPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-12">
      <Tarjeta titulo="Crear cuenta">
        <FormularioRegistro />
      </Tarjeta>
    </main>
  );
}
