import type { ComponentProps, ReactNode } from "react";

export function Tarjeta({ children, titulo }: { children: ReactNode; titulo?: string }) {
  return (
    <section className="w-full max-w-md rounded-2xl border border-black/10 bg-white p-8 shadow-sm dark:border-white/15 dark:bg-neutral-900">
      {titulo ? <h1 className="mb-6 text-2xl font-semibold">{titulo}</h1> : null}
      {children}
    </section>
  );
}

export function Campo({
  etiqueta,
  errores,
  ...props
}: ComponentProps<"input"> & { etiqueta: string; errores?: string[] }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium">{etiqueta}</span>
      <input
        {...props}
        className="w-full rounded-lg border border-black/15 bg-transparent px-3 py-2 outline-none focus:border-blue-600 dark:border-white/20"
      />
      {errores?.map((error) => (
        <span key={error} className="mt-1 block text-sm text-red-600">
          {error}
        </span>
      ))}
    </label>
  );
}

export function Boton({ children, ...props }: ComponentProps<"button">) {
  return (
    <button
      {...props}
      className="w-full rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition hover:bg-blue-700 disabled:opacity-60"
    >
      {children}
    </button>
  );
}

export function Alerta({ tipo, children }: { tipo: "error" | "ok"; children: ReactNode }) {
  const estilo =
    tipo === "error"
      ? "border-red-300 bg-red-50 text-red-800 dark:bg-red-950/40 dark:text-red-200"
      : "border-green-300 bg-green-50 text-green-800 dark:bg-green-950/40 dark:text-green-200";

  return <p className={`mb-4 rounded-lg border px-3 py-2 text-sm ${estilo}`}>{children}</p>;
}
