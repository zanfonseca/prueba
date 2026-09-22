import "server-only";
import { redirect } from "next/navigation";
import type { Subscription, User } from "@prisma/client";
import { prisma } from "@/lib/db";
import { leerSesion } from "@/lib/session";

export type UsuarioConSuscripcion = User & { subscription: Subscription | null };

export async function usuarioActual(): Promise<UsuarioConSuscripcion | null> {
  const sesion = await leerSesion();
  if (!sesion) return null;

  return prisma.user.findUnique({
    where: { id: sesion.userId },
    include: { subscription: true },
  });
}

export async function requerirUsuario(): Promise<UsuarioConSuscripcion> {
  const usuario = await usuarioActual();
  if (!usuario) redirect("/login");
  return usuario;
}
