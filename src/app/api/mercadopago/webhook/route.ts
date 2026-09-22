import { NextResponse, type NextRequest } from "next/server";
import { SubscriptionStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import {
  firmaWebhookValida,
  obtenerFactura,
  obtenerPago,
  obtenerPreaprobacion,
} from "@/lib/mercadopago";
import { registrarPagoYRenovar } from "@/lib/suscripcion";

type Notificacion = {
  type?: string;
  topic?: string;
  action?: string;
  data?: { id?: string };
};

async function usuarioDePreaprobacion(preapprovalId: string) {
  const suscripcion = await prisma.subscription.findUnique({ where: { preapprovalId } });
  if (suscripcion) return suscripcion.userId;

  const preaprobacion = await obtenerPreaprobacion(preapprovalId);
  const userId = preaprobacion.external_reference;
  if (!userId) return null;

  const usuario = await prisma.user.findUnique({ where: { id: userId } });
  return usuario?.id ?? null;
}

/** Notificación de cambio de estado de la suscripción (authorized, paused, cancelled). */
async function procesarPreaprobacion(preapprovalId: string) {
  const preaprobacion = await obtenerPreaprobacion(preapprovalId);
  const userId = preaprobacion.external_reference;
  if (!userId) return;

  const usuario = await prisma.user.findUnique({ where: { id: userId } });
  if (!usuario) return;

  const cancelada = preaprobacion.status === "cancelled";

  await prisma.subscription.upsert({
    where: { userId },
    create: {
      userId,
      preapprovalId,
      status: cancelada ? SubscriptionStatus.CANCELLED : SubscriptionStatus.PENDING,
    },
    update: {
      preapprovalId,
      ...(cancelada
        ? { status: SubscriptionStatus.CANCELLED, cancelledAt: new Date() }
        : {}),
    },
  });
}

/** Cobro recurrente de la suscripción: renueva 30 días más si fue aprobado. */
async function procesarCobroDeSuscripcion(facturaId: string) {
  const factura = await obtenerFactura(facturaId);
  if (factura.payment?.status !== "approved" || !factura.preapproval_id) return;

  const userId = await usuarioDePreaprobacion(factura.preapproval_id);
  if (!userId) return;

  await registrarPagoYRenovar({
    userId,
    mpPaymentId: String(factura.payment.id),
    amount: factura.transaction_amount ?? env.precioSuscripcion,
    currency: factura.currency_id ?? env.monedaSuscripcion,
    status: factura.payment.status,
    paidAt: factura.debit_date ? new Date(factura.debit_date) : new Date(),
    preapprovalId: factura.preapproval_id,
  });
}

/** Pago suelto asociado a la suscripción (primer cobro en algunos flujos). */
async function procesarPago(pagoId: string) {
  const pago = await obtenerPago(pagoId);
  if (pago.status !== "approved") return;

  const userId = pago.external_reference;
  if (!userId) return;

  const usuario = await prisma.user.findUnique({ where: { id: userId } });
  if (!usuario) return;

  await registrarPagoYRenovar({
    userId,
    mpPaymentId: String(pago.id),
    amount: pago.transaction_amount ?? env.precioSuscripcion,
    currency: pago.currency_id ?? env.monedaSuscripcion,
    status: pago.status,
    paidAt: pago.date_approved ? new Date(pago.date_approved) : new Date(),
  });
}

export async function POST(request: NextRequest) {
  const cuerpo = (await request.json().catch(() => null)) as Notificacion | null;
  if (!cuerpo) return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 });

  const dataId =
    cuerpo.data?.id ?? request.nextUrl.searchParams.get("data.id") ?? request.nextUrl.searchParams.get("id");

  const firmaOk = firmaWebhookValida({
    xSignature: request.headers.get("x-signature"),
    xRequestId: request.headers.get("x-request-id"),
    dataId,
  });

  if (!firmaOk) return NextResponse.json({ error: "Firma inválida" }, { status: 401 });
  if (!dataId) return NextResponse.json({ recibido: true });

  const tipo = cuerpo.type ?? cuerpo.topic ?? "";

  try {
    switch (tipo) {
      case "subscription_preapproval":
      case "preapproval":
        await procesarPreaprobacion(dataId);
        break;
      case "subscription_authorized_payment":
        await procesarCobroDeSuscripcion(dataId);
        break;
      case "payment":
        await procesarPago(dataId);
        break;
      default:
        break;
    }
  } catch (error) {
    // Se devuelve 500 para que MercadoPago reintente la notificación.
    console.error(`Error procesando webhook (${tipo}/${dataId})`, error);
    return NextResponse.json({ error: "Error procesando la notificación" }, { status: 500 });
  }

  return NextResponse.json({ recibido: true });
}
