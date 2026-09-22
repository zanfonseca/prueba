import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

const SESSION_COOKIE = "sesion";
const RUTAS_PRIVADAS = ["/panel", "/suscripcion", "/contenido"];
const RUTAS_DE_INVITADO = ["/login", "/registro", "/recuperar", "/restablecer"];

async function haySesion(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  try {
    const clave = new TextEncoder().encode(process.env.SESSION_SECRET);
    await jwtVerify(token, clave, { algorithms: ["HS256"] });
    return true;
  } catch {
    return false;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const autenticado = await haySesion(request.cookies.get(SESSION_COOKIE)?.value);

  if (!autenticado && RUTAS_PRIVADAS.some((ruta) => pathname.startsWith(ruta))) {
    const destino = new URL("/login", request.url);
    destino.searchParams.set("siguiente", pathname);
    return NextResponse.redirect(destino);
  }

  if (autenticado && RUTAS_DE_INVITADO.some((ruta) => pathname.startsWith(ruta))) {
    return NextResponse.redirect(new URL("/panel", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/panel/:path*",
    "/suscripcion/:path*",
    "/contenido/:path*",
    "/login",
    "/registro",
    "/recuperar",
    "/restablecer",
  ],
};
