"use client";

import { useState, useTransition } from "react";
import { cancelarSuscripcion, iniciarSuscripcion } from "@/app/acciones/suscripcion";
import { Alerta, Boton } from "@/components/ui";

export function AccionesSuscripcion({ activa }: { activa: boolean }) {
  const [pendiente, iniciarTransicion] = useTransition();
  const [estado, setEstado] = useState<{ ok: boolean; mensaje?: string } | null>(null);

  function ejecutar(accion: () => Promise<{ ok: boolean; mensaje?: string }>) {
    iniciarTransicion(async () => {
      setEstado(await accion());
    });
  }

  return (
    <div className="space-y-4">
      {estado?.mensaje ? (
        <Alerta tipo={estado.ok ? "ok" : "error"}>{estado.mensaje}</Alerta>
      ) : null}

      <Boton
        type="button"
        disabled={pendiente}
        onClick={() => ejecutar(iniciarSuscripcion)}
      >
        {pendiente ? "Conectando con MercadoPago…" : activa ? "Renovar 30 días" : "Suscribirme"}
      </Boton>

      {activa ? (
        <button
          type="button"
          disabled={pendiente}
          onClick={() => ejecutar(cancelarSuscripcion)}
          className="w-full rounded-lg border border-black/15 px-4 py-2 text-sm transition hover:bg-black/5 disabled:opacity-60 dark:border-white/20 dark:hover:bg-white/10"
        >
          Cancelar renovación automática
        </button>
      ) : null}
    </div>
  );
}
