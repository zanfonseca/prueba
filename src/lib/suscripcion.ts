import "server-only";
import { Prisma, SubscriptionStatus, type Subscription } from "@prisma/client";
import { prisma } from "@/lib/db";

export const DIAS_DE_CICLO = 30;

export function estaActiva(suscripcion: Subscription | null): boolean {
  if (!suscripcion) return false;
  if (suscripcion.status !== SubscriptionStatus.ACTIVE) return false;
  return !!suscripcion.currentPeriodEnd && suscripcion.currentPeriodEnd > new Date();
}

export function diasRestantes(suscripcion: Subscription | null): number {
  if (!suscripcion?.currentPeriodEnd) return 0;
  const ms = suscripcion.currentPeriodEnd.getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (24 * 60 * 60 * 1000)));
}

/**
 * Extiende el periodo 30 días desde el vencimiento vigente (para no perder días
 * al renovar antes de tiempo) o desde hoy si ya venció.
 */
export function proximoVencimiento(vencimientoActual: Date | null): Date {
  const base =
    vencimientoActual && vencimientoActual > new Date() ? vencimientoActual : new Date();
  return new Date(base.getTime() + DIAS_DE_CICLO * 24 * 60 * 60 * 1000);
}

export async function obtenerSuscripcion(userId: string): Promise<Subscription | null> {
  return prisma.subscription.findUnique({ where: { userId } });
}

export async function registrarPagoYRenovar(datos: {
  userId: string;
  mpPaymentId: string;
  amount: Prisma.Decimal | number;
  currency: string;
  status: string;
  paidAt: Date;
  preapprovalId?: string | null;
}): Promise<void> {
  const yaRegistrado = await prisma.payment.findUnique({
    where: { mpPaymentId: datos.mpPaymentId },
  });
  if (yaRegistrado) return;

  const suscripcion = await prisma.subscription.findUnique({
    where: { userId: datos.userId },
  });

  await prisma.$transaction([
    prisma.payment.create({
      data: {
        userId: datos.userId,
        mpPaymentId: datos.mpPaymentId,
        amount: new Prisma.Decimal(datos.amount.toString()),
        currency: datos.currency,
        status: datos.status,
        paidAt: datos.paidAt,
      },
    }),
    prisma.subscription.upsert({
      where: { userId: datos.userId },
      create: {
        userId: datos.userId,
        status: SubscriptionStatus.ACTIVE,
        preapprovalId: datos.preapprovalId ?? null,
        currentPeriodEnd: proximoVencimiento(null),
      },
      update: {
        status: SubscriptionStatus.ACTIVE,
        cancelledAt: null,
        preapprovalId: datos.preapprovalId ?? suscripcion?.preapprovalId ?? null,
        currentPeriodEnd: proximoVencimiento(suscripcion?.currentPeriodEnd ?? null),
      },
    }),
  ]);
}

/** Marca como vencidas las suscripciones cuyo periodo de 30 días ya terminó. */
export async function expirarVencidas(): Promise<number> {
  const { count } = await prisma.subscription.updateMany({
    where: {
      status: { in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.CANCELLED] },
      currentPeriodEnd: { lt: new Date() },
    },
    data: { status: SubscriptionStatus.EXPIRED },
  });
  return count;
}
