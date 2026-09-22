"use client";

import { useActionState } from "react";
import { restablecerPassword, type EstadoFormulario } from "@/app/acciones/auth";
import { Alerta, Boton, Campo } from "@/components/ui";

const inicial: EstadoFormulario = { ok: false };

export function FormularioRestablecer({ token }: { token: string }) {
  const [estado, accion, enviando] = useActionState(restablecerPassword, inicial);

  return (
    <form action={accion} className="space-y-4">
      {estado.mensaje ? <Alerta tipo="error">{estado.mensaje}</Alerta> : null}

      <input type="hidden" name="token" value={token} />

      <Campo
        etiqueta="Nueva contraseña"
        name="password"
        type="password"
        autoComplete="new-password"
        required
        errores={estado.errores?.password}
      />
      <Campo
        etiqueta="Repite la contraseña"
        name="confirmacion"
        type="password"
        autoComplete="new-password"
        required
        errores={estado.errores?.confirmacion}
      />

      <Boton type="submit" disabled={enviando}>
        {enviando ? "Guardando…" : "Guardar contraseña"}
      </Boton>
    </form>
  );
}
