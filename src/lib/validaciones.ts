import { z } from "zod";

export const registroSchema = z.object({
  nombre: z.string().trim().min(2, "El nombre debe tener al menos 2 caracteres"),
  email: z.string().trim().toLowerCase().email("Correo inválido"),
  password: z
    .string()
    .min(8, "La contraseña debe tener al menos 8 caracteres")
    .regex(/[a-zA-Z]/, "La contraseña debe incluir al menos una letra")
    .regex(/[0-9]/, "La contraseña debe incluir al menos un número"),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Correo inválido"),
  password: z.string().min(1, "Ingresa tu contraseña"),
});

export const solicitarRecuperacionSchema = z.object({
  email: z.string().trim().toLowerCase().email("Correo inválido"),
});

export const restablecerSchema = z
  .object({
    token: z.string().min(1, "Token inválido"),
    password: registroSchema.shape.password,
    confirmacion: z.string(),
  })
  .refine((datos) => datos.password === datos.confirmacion, {
    path: ["confirmacion"],
    message: "Las contraseñas no coinciden",
  });

export type ErroresCampo = Record<string, string[]>;

export function erroresDeZod(error: z.ZodError): ErroresCampo {
  const salida: ErroresCampo = {};
  for (const issue of error.issues) {
    const campo = issue.path.join(".") || "_";
    salida[campo] = [...(salida[campo] ?? []), issue.message];
  }
  return salida;
}
