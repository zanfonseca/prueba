import { cerrarSesion } from "@/app/acciones/auth";

export function BotonCerrarSesion() {
  return (
    <form action={cerrarSesion}>
      <button
        type="submit"
        className="rounded-lg border border-black/15 px-3 py-1.5 text-sm transition hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10"
      >
        Cerrar sesión
      </button>
    </form>
  );
}
