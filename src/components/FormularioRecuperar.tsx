"use client";

import { useActionState } from "react";
import Link from "next/link";
import { solicitarRecuperacion, type EstadoFormulario } from "@/app/acciones/auth";
import { Alerta, Boton, Campo } from "@/components/ui";

const inicial: EstadoFormulario = { ok: false };

export function FormularioRecuperar() {
  const [estado, accion, enviando] = useActionState(solicitarRecuperacion, inicial);

  return (
    <form action={accion} className="space-y-4">
      {estado.mensaje ? (
        <Alerta tipo={estado.ok ? "ok" : "error"}>{estado.mensaje}</Alerta>
      ) : null}

      <p className="text-sm text-black/70 dark:text-white/70">
        Te enviaremos un enlace para crear una contraseña nueva. Vence en 1 hora.
      </p>

      <Campo
        etiqueta="Correo electrónico"
        name="email"
        type="email"
        autoComplete="email"
        required
        errores={estado.errores?.email}
      />

      <Boton type="submit" disabled={enviando}>
        {enviando ? "Enviando…" : "Enviar enlace"}
      </Boton>

      <p className="text-center text-sm">
        <Link href="/login" className="text-blue-600 hover:underline">
          Volver a iniciar sesión
        </Link>
      </p>
    </form>
  );
}
