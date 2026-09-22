import "server-only";

type Registro = { intentos: number; reiniciaEn: number };

const memoria = new Map<string, Registro>();

/**
 * Limitador simple en memoria (por proceso). Para varias instancias conviene
 * reemplazarlo por Redis o similar.
 */
export function permitirIntento(clave: string, maximo = 5, ventanaMs = 15 * 60 * 1000): boolean {
  const ahora = Date.now();
  const actual = memoria.get(clave);

  if (!actual || actual.reiniciaEn < ahora) {
    memoria.set(clave, { intentos: 1, reiniciaEn: ahora + ventanaMs });
    return true;
  }

  if (actual.intentos >= maximo) return false;

  actual.intentos += 1;
  return true;
}

export function reiniciarIntentos(clave: string): void {
  memoria.delete(clave);
}
