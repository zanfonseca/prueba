import "server-only";
import crypto from "node:crypto";
import { MercadoPagoConfig, PreApproval, Payment, Invoice } from "mercadopago";
import { env } from "@/lib/env";
import { DIAS_DE_CICLO } from "@/lib/suscripcion";

function cliente() {
  return new MercadoPagoConfig({ accessToken: env.mercadoPagoAccessToken });
}

/**
 * Crea la suscripción en MercadoPago y devuelve el enlace de autorización.
 * `external_reference` guarda el id del usuario para reconocerlo en el webhook.
 */
export async function crearPreaprobacion(datos: {
  userId: string;
  email: string;
}): Promise<{ id: string; initPoint: string }> {
  const preApproval = new PreApproval(cliente());

  const respuesta = await preApproval.create({
    body: {
      reason: "Suscripción mensual",
      external_reference: datos.userId,
      payer_email: datos.email,
      back_url: `${env.appUrl}/suscripcion/resultado`,
      status: "pending",
      auto_recurring: {
        frequency: DIAS_DE_CICLO,
        frequency_type: "days",
        transaction_amount: env.precioSuscripcion,
        currency_id: env.monedaSuscripcion,
      },
    },
  });

  if (!respuesta.id || !respuesta.init_point) {
    throw new Error("MercadoPago no devolvió el enlace de pago");
  }

  return { id: respuesta.id, initPoint: respuesta.init_point };
}

export async function obtenerPreaprobacion(id: string) {
  return new PreApproval(cliente()).get({ id });
}

export async function cancelarPreaprobacion(id: string): Promise<void> {
  await new PreApproval(cliente()).update({ id, body: { status: "cancelled" } });
}

export async function obtenerPago(id: string) {
  return new Payment(cliente()).get({ id });
}

/** Factura (authorized payment) generada por un cobro recurrente. */
export async function obtenerFactura(id: string) {
  return new Invoice(cliente()).get({ id });
}

/**
 * Valida la firma `x-signature` del webhook.
 * Manifest: `id:<data.id>;request-id:<x-request-id>;ts:<ts>;`
 * https://www.mercadopago.com/developers/es/docs/your-integrations/notifications/webhooks
 */
export function firmaWebhookValida(opciones: {
  xSignature: string | null;
  xRequestId: string | null;
  dataId: string | null;
}): boolean {
  const secreto = env.mercadoPagoWebhookSecret;
  if (!secreto) return true; // sin secreto configurado no se valida (útil en desarrollo)
  if (!opciones.xSignature || !opciones.dataId) return false;

  const partes = Object.fromEntries(
    opciones.xSignature.split(",").map((parte) => {
      const [clave, ...resto] = parte.split("=");
      return [clave.trim(), resto.join("=").trim()];
    }),
  );

  const ts = partes.ts;
  const hash = partes.v1;
  if (!ts || !hash) return false;

  const manifest = `id:${opciones.dataId.toLowerCase()};request-id:${opciones.xRequestId ?? ""};ts:${ts};`;
  const esperado = crypto.createHmac("sha256", secreto).update(manifest).digest("hex");

  const a = Buffer.from(esperado, "utf8");
  const b = Buffer.from(hash, "utf8");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
