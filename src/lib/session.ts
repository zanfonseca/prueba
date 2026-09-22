import { cookies } from "next/headers";
import { jwtVerify, SignJWT } from "jose";
import { env } from "@/lib/env";

export const SESSION_COOKIE = "sesion";
const DURACION_SESION_DIAS = 7;

export type SessionPayload = {
  userId: string;
  email: string;
};

function clave() {
  return new TextEncoder().encode(env.sessionSecret);
}

export async function firmarSesion(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${DURACION_SESION_DIAS}d`)
    .sign(clave());
}

export async function verificarSesion(
  token: string | undefined,
): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, clave(), { algorithms: ["HS256"] });
    if (typeof payload.userId !== "string" || typeof payload.email !== "string") {
      return null;
    }
    return { userId: payload.userId, email: payload.email };
  } catch {
    return null;
  }
}

export async function crearSesion(payload: SessionPayload): Promise<void> {
  const token = await firmarSesion(payload);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(Date.now() + DURACION_SESION_DIAS * 24 * 60 * 60 * 1000),
  });
}

export async function leerSesion(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  return verificarSesion(cookieStore.get(SESSION_COOKIE)?.value);
}

export async function borrarSesion(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}
