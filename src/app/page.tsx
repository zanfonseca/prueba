import Link from "next/link";
import { usuarioActual } from "@/lib/auth";

export default async function Inicio() {
  const usuario = await usuarioActual();

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center gap-8 px-6">
      <div>
        <h1 className="text-4xl font-semibold">Acceso con suscripción</h1>
        <p className="mt-3 text-black/70 dark:text-white/70">
          Regístrate, inicia sesión y activa tu suscripción mensual (30 días) con MercadoPago para
          entrar al contenido exclusivo.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        {usuario ? (
          <Link
            href="/panel"
            className="rounded-lg bg-blue-600 px-5 py-2.5 font-medium text-white hover:bg-blue-700"
          >
            Ir a mi panel
          </Link>
        ) : (
          <>
            <Link
              href="/registro"
              className="rounded-lg bg-blue-600 px-5 py-2.5 font-medium text-white hover:bg-blue-700"
            >
              Crear cuenta
            </Link>
            <Link
              href="/login"
              className="rounded-lg border border-black/15 px-5 py-2.5 font-medium hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10"
            >
              Iniciar sesión
            </Link>
          </>
        )}
      </div>
    </main>
  );
}
