"use client";

import { useActionState } from "react";
import Link from "next/link";
import { registrar, type EstadoFormulario } from "@/app/acciones/auth";
import { Alerta, Boton, Campo } from "@/components/ui";

const inicial: EstadoFormulario = { ok: false };

export function FormularioRegistro() {
  const [estado, accion, enviando] = useActionState(registrar, inicial);

  return (
    <form action={accion} className="space-y-4">
      {estado.mensaje ? <Alerta tipo="error">{estado.mensaje}</Alerta> : null}

      <Campo
        etiqueta="Nombre"
        name="nombre"
        autoComplete="name"
        required
        errores={estado.errores?.nombre}
      />
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
        autoComplete="new-password"
        required
        errores={estado.errores?.password}
      />

      <Boton type="submit" disabled={enviando}>
        {enviando ? "Creando cuenta…" : "Crear cuenta"}
      </Boton>

      <p className="text-center text-sm">
        ¿Ya tienes cuenta?{" "}
        <Link href="/login" className="text-blue-600 hover:underline">
          Inicia sesión
        </Link>
      </p>
    </form>
  );
}
