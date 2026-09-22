"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { SubscriptionStatus } from "@prisma/client";
import { requerirUsuario } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { cancelarPreaprobacion, crearPreaprobacion } from "@/lib/mercadopago";

export type EstadoSuscripcion = { ok: boolean; mensaje?: string };

/** Crea la suscripción en MercadoPago y manda al usuario al checkout. */
export async function iniciarSuscripcion(): Promise<EstadoSuscripcion> {
  const usuario = await requerirUsuario();

  let initPoint: string;
  try {
    const preaprobacion = await crearPreaprobacion({
      userId: usuario.id,
      email: usuario.email,
    });

    await prisma.subscription.upsert({
      where: { userId: usuario.id },
      create: {
        userId: usuario.id,
        status: SubscriptionStatus.PENDING,
        preapprovalId: preaprobacion.id,
      },
      update: {
        status:
          usuario.subscription?.status === SubscriptionStatus.ACTIVE
            ? SubscriptionStatus.ACTIVE
            : SubscriptionStatus.PENDING,
        preapprovalId: preaprobacion.id,
      },
    });

    initPoint = preaprobacion.initPoint;
  } catch (error) {
    console.error("No se pudo crear la suscripción en MercadoPago", error);
    return { ok: false, mensaje: "No pudimos conectar con MercadoPago. Inténtalo más tarde." };
  }

  redirect(initPoint);
}

/**
 * Cancela la renovación automática. El acceso se mantiene hasta que termine
 * el periodo de 30 días ya pagado.
 */
export async function cancelarSuscripcion(): Promise<EstadoSuscripcion> {
  const usuario = await requerirUsuario();
  const suscripcion = usuario.subscription;

  if (!suscripcion) {
    return { ok: false, mensaje: "No tienes una suscripción activa." };
  }

  if (suscripcion.preapprovalId) {
    try {
      await cancelarPreaprobacion(suscripcion.preapprovalId);
    } catch (error) {
      console.error("No se pudo cancelar en MercadoPago", error);
      return { ok: false, mensaje: "No pudimos cancelar en MercadoPago. Inténtalo más tarde." };
    }
  }

  await prisma.subscription.update({
    where: { userId: usuario.id },
    data: { status: SubscriptionStatus.CANCELLED, cancelledAt: new Date() },
  });

  revalidatePath("/suscripcion");
  revalidatePath("/panel");

  return {
    ok: true,
    mensaje: "Cancelamos la renovación automática. Mantienes el acceso hasta el vencimiento.",
  };
}
