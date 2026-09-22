import { NextResponse, type NextRequest } from "next/server";
import { expirarVencidas } from "@/lib/suscripcion";

/**
 * Marca como vencidas las suscripciones cuyo ciclo de 30 días terminó.
 * Programa una llamada diaria (Vercel Cron, cron del servidor, etc.) con el
 * header `Authorization: Bearer $CRON_SECRET`.
 */
export async function GET(request: NextRequest) {
  const secreto = process.env.CRON_SECRET;

  if (secreto && request.headers.get("authorization") !== `Bearer ${secreto}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const expiradas = await expirarVencidas();
  return NextResponse.json({ expiradas });
}
