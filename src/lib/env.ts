import "server-only";

function requerido(nombre: string): string {
  const valor = process.env[nombre];
  if (!valor) {
    throw new Error(`Falta la variable de entorno ${nombre}`);
  }
  return valor;
}

export const env = {
  get sessionSecret() {
    return requerido("SESSION_SECRET");
  },
  get appUrl() {
    return process.env.APP_URL ?? "http://localhost:3000";
  },
  get mercadoPagoAccessToken() {
    return requerido("MERCADOPAGO_ACCESS_TOKEN");
  },
  get mercadoPagoWebhookSecret() {
    return process.env.MERCADOPAGO_WEBHOOK_SECRET ?? "";
  },
  get precioSuscripcion() {
    return Number(process.env.SUSCRIPCION_PRECIO ?? "10000");
  },
  get monedaSuscripcion() {
    return process.env.SUSCRIPCION_MONEDA ?? "ARS";
  },
  get smtp() {
    const host = process.env.SMTP_HOST;
    if (!host) return null;
    return {
      host,
      port: Number(process.env.SMTP_PORT ?? "587"),
      user: process.env.SMTP_USER ?? "",
      password: process.env.SMTP_PASSWORD ?? "",
      from: process.env.SMTP_FROM ?? "no-reply@example.com",
    };
  },
};
