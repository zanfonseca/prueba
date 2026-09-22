"use server";

import crypto from "node:crypto";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { correoRecuperacion, enviarCorreo } from "@/lib/mail";
import { permitirIntento, reiniciarIntentos } from "@/lib/limite";
import { borrarSesion, crearSesion } from "@/lib/session";
import {
  erroresDeZod,
  loginSchema,
  registroSchema,
  restablecerSchema,
  solicitarRecuperacionSchema,
  type ErroresCampo,
} from "@/lib/validaciones";

export type EstadoFormulario = {
  ok: boolean;
  mensaje?: string;
  errores?: ErroresCampo;
};

const VIGENCIA_TOKEN_MS = 60 * 60 * 1000;

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function registrar(
  _estado: EstadoFormulario,
  datos: FormData,
): Promise<EstadoFormulario> {
  const analisis = registroSchema.safeParse({
    nombre: datos.get("nombre"),
    email: datos.get("email"),
    password: datos.get("password"),
  });

  if (!analisis.success) {
    return { ok: false, errores: erroresDeZod(analisis.error) };
  }

  const { nombre, email, password } = analisis.data;

  const existente = await prisma.user.findUnique({ where: { email } });
  if (existente) {
    return { ok: false, errores: { email: ["Ya existe una cuenta con este correo"] } };
  }

  const usuario = await prisma.user.create({
    data: {
      nombre,
      email,
      passwordHash: await bcrypt.hash(password, 12),
      subscription: { create: {} },
    },
  });

  await crearSesion({ userId: usuario.id, email: usuario.email });
  redirect("/panel");
}

export async function iniciarSesion(
  _estado: EstadoFormulario,
  datos: FormData,
): Promise<EstadoFormulario> {
  const analisis = loginSchema.safeParse({
    email: datos.get("email"),
    password: datos.get("password"),
  });

  if (!analisis.success) {
    return { ok: false, errores: erroresDeZod(analisis.error) };
  }

  const { email, password } = analisis.data;

  if (!permitirIntento(`login:${email}`)) {
    return { ok: false, mensaje: "Demasiados intentos. Espera unos minutos e inténtalo de nuevo." };
  }

  const usuario = await prisma.user.findUnique({ where: { email } });
  const coincide = usuario ? await bcrypt.compare(password, usuario.passwordHash) : false;

  if (!usuario || !coincide) {
    return { ok: false, mensaje: "Correo o contraseña incorrectos" };
  }

  reiniciarIntentos(`login:${email}`);
  await crearSesion({ userId: usuario.id, email: usuario.email });
  redirect("/panel");
}

export async function cerrarSesion(): Promise<void> {
  await borrarSesion();
  redirect("/login");
}

export async function solicitarRecuperacion(
  _estado: EstadoFormulario,
  datos: FormData,
): Promise<EstadoFormulario> {
  const analisis = solicitarRecuperacionSchema.safeParse({ email: datos.get("email") });

  if (!analisis.success) {
    return { ok: false, errores: erroresDeZod(analisis.error) };
  }

  const { email } = analisis.data;
  const respuestaNeutra: EstadoFormulario = {
    ok: true,
    mensaje: "Si el correo está registrado, te enviamos un enlace para restablecer tu contraseña.",
  };

  if (!permitirIntento(`recuperacion:${email}`, 3, 15 * 60 * 1000)) {
    return respuestaNeutra;
  }

  const usuario = await prisma.user.findUnique({ where: { email } });
  if (!usuario) return respuestaNeutra;

  const token = crypto.randomBytes(32).toString("hex");

  await prisma.passwordResetToken.create({
    data: {
      userId: usuario.id,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + VIGENCIA_TOKEN_MS),
    },
  });

  const enlace = `${env.appUrl}/restablecer?token=${token}`;
  await enviarCorreo({ para: usuario.email, ...correoRecuperacion(usuario.nombre, enlace) });

  return respuestaNeutra;
}

export async function restablecerPassword(
  _estado: EstadoFormulario,
  datos: FormData,
): Promise<EstadoFormulario> {
  const analisis = restablecerSchema.safeParse({
    token: datos.get("token"),
    password: datos.get("password"),
    confirmacion: datos.get("confirmacion"),
  });

  if (!analisis.success) {
    return { ok: false, errores: erroresDeZod(analisis.error) };
  }

  const { token, password } = analisis.data;

  const registro = await prisma.passwordResetToken.findUnique({
    where: { tokenHash: hashToken(token) },
  });

  if (!registro || registro.usedAt || registro.expiresAt < new Date()) {
    return { ok: false, mensaje: "El enlace es inválido o ya venció. Solicita uno nuevo." };
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: registro.userId },
      data: { passwordHash: await bcrypt.hash(password, 12) },
    }),
    prisma.passwordResetToken.update({
      where: { id: registro.id },
      data: { usedAt: new Date() },
    }),
    // Invalida el resto de enlaces pendientes del usuario.
    prisma.passwordResetToken.updateMany({
      where: { userId: registro.userId, usedAt: null },
      data: { usedAt: new Date() },
    }),
  ]);

  redirect("/login?restablecida=1");
}
