"use client";

import { useActionState } from "react";
import Link from "next/link";
import { iniciarSesion, type EstadoFormulario } from "@/app/acciones/auth";
import { Alerta, Boton, Campo } from "@/components/ui";

const inicial: EstadoFormulario = { ok: false };

export function FormularioLogin({ avisoRestablecida }: { avisoRestablecida?: boolean }) {
  const [estado, accion, enviando] = useActionState(iniciarSesion, inicial);

  return (
    <form action={accion} className="space-y-4">
      {avisoRestablecida ? (
        <Alerta tipo="ok">Tu contraseña se actualizó. Ya puedes iniciar sesión.</Alerta>
      ) : null}
      {estado.mensaje ? <Alerta tipo="error">{estado.mensaje}</Alerta> : null}

      <Campo
        etiqueta="Correo electrónico"
        name="email"
        type="email"
        autoComplete="email"
        required
        errores={estado.errores?.email}
      />
      <Campo
        etiqueta="Contraseña"
        name="password"
        type="password"
        autoComplete="current-password"
        required
        errores={estado.errores?.password}
      />

      <Boton type="submit" disabled={enviando}>
        {enviando ? "Entrando…" : "Iniciar sesión"}
      </Boton>

      <div className="flex justify-between text-sm">
        <Link href="/recuperar" className="text-blue-600 hover:underline">
          Olvidé mi contraseña
        </Link>
        <Link href="/registro" className="text-blue-600 hover:underline">
          Crear cuenta
        </Link>
      </div>
    </form>
  );
}
