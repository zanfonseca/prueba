import type { Metadata } from "next";
import { FormularioRecuperar } from "@/components/FormularioRecuperar";
import { Tarjeta } from "@/components/ui";

export const metadata: Metadata = { title: "Recuperar contraseña" };

export default function RecuperarPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-12">
      <Tarjeta titulo="Recuperar contraseña">
        <FormularioRecuperar />
      </Tarjeta>
    </main>
  );
}
