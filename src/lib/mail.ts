import "server-only";
import nodemailer from "nodemailer";
import { env } from "@/lib/env";

type Correo = {
  para: string;
  asunto: string;
  html: string;
  texto: string;
};

export async function enviarCorreo({ para, asunto, html, texto }: Correo): Promise<void> {
  const smtp = env.smtp;

  if (!smtp) {
    console.info(`[correo] Para: ${para}\nAsunto: ${asunto}\n${texto}`);
    return;
  }

  const transporte = nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.port === 465,
    auth: smtp.user ? { user: smtp.user, pass: smtp.password } : undefined,
  });

  await transporte.sendMail({ from: smtp.from, to: para, subject: asunto, text: texto, html });
}

export function correoRecuperacion(nombre: string, enlace: string): Omit<Correo, "para"> {
  const texto = `Hola ${nombre}, para restablecer tu contraseña entra a: ${enlace}\nEl enlace vence en 1 hora. Si no lo solicitaste, ignora este mensaje.`;
  return {
    asunto: "Restablece tu contraseña",
    texto,
    html: `<p>Hola ${nombre},</p>
<p>Recibimos una solicitud para restablecer tu contraseña.</p>
<p><a href="${enlace}">Restablecer contraseña</a></p>
<p>El enlace vence en 1 hora. Si no lo solicitaste, ignora este mensaje.</p>`,
  };
}
