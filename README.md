# Sistema de usuarios y suscripciones (Next.js + MercadoPago)

Registro, inicio de sesión, recuperación de contraseña y suscripción de 30 días cobrada con
MercadoPago. Pensado para integrarse en un sitio Next.js ya existente.

## Qué incluye

| Función | Dónde está |
| --- | --- |
| Registro con validación y hash bcrypt | `src/app/acciones/auth.ts`, `/registro` |
| Inicio de sesión con sesión JWT en cookie httpOnly | `src/lib/session.ts`, `/login` |
| Recuperación de contraseña por correo (token de 1 hora, de un solo uso) | `/recuperar`, `/restablecer` |
| Protección de rutas privadas | `src/proxy.ts` |
| Suscripción de 30 días con renovación automática | `src/lib/mercadopago.ts`, `/suscripcion` |
| Webhook de MercadoPago (alta, cobro recurrente, cancelación) | `src/app/api/mercadopago/webhook/route.ts` |
| Cancelación sin perder los días ya pagados | `src/app/acciones/suscripcion.ts` |
| Tarea para vencer suscripciones | `src/app/api/cron/expirar/route.ts` |
| Contenido solo para suscriptores activos | `/contenido` |

## Puesta en marcha

```bash
npm install
cp .env.example .env      # completa las variables
npm run db:migrate        # crea las tablas en PostgreSQL
npm run dev
```

Variables de entorno mínimas: `DATABASE_URL`, `SESSION_SECRET` (`openssl rand -base64 32`),
`APP_URL` y `MERCADOPAGO_ACCESS_TOKEN`. Sin SMTP configurado, el enlace de recuperación se
imprime en la consola del servidor, lo que sirve para probar en local.

## MercadoPago

1. Crea una aplicación en el panel de desarrolladores y copia el **Access Token**
   (usa las credenciales de prueba mientras integras).
2. Configura el webhook apuntando a `https://TU-DOMINIO/api/mercadopago/webhook` y suscríbelo a
   los eventos de *Suscripciones* (`subscription_preapproval`, `subscription_authorized_payment`)
   y *Pagos* (`payment`).
3. Copia la **clave secreta** del webhook en `MERCADOPAGO_WEBHOOK_SECRET`; la firma `x-signature`
   se valida en cada notificación. Si la dejas vacía, la validación se omite (solo para desarrollo).
4. Ajusta el precio y la moneda con `SUSCRIPCION_PRECIO` y `SUSCRIPCION_MONEDA`.

El cobro se crea como *preapproval* con `frequency: 30, frequency_type: "days"` y
`external_reference` = id del usuario, que es como el webhook reconoce a quién renovarle el
acceso. Cada pago aprobado suma 30 días a partir del vencimiento vigente, así que renovar antes
de tiempo no pierde días.

Para probar el webhook en local, expón el puerto 3000 (por ejemplo con `ngrok`) y usa esa URL
pública en el panel de MercadoPago.

## Vencimientos

El acceso depende de `Subscription.currentPeriodEnd`, así que un usuario deja de entrar apenas
vence aunque no corra ninguna tarea. Para que el estado quede prolijo (`EXPIRED`), programa una
llamada diaria a `/api/cron/expirar` con el header `Authorization: Bearer $CRON_SECRET`.

## Integrarlo en tu sitio actual

- Copia `prisma/`, `src/lib/`, `src/app/acciones/`, `src/app/api/`, `src/components/` y las
  páginas `registro`, `login`, `recuperar`, `restablecer`, `panel`, `suscripcion`.
- Une el contenido de `src/proxy.ts` con tu `proxy.ts`/`middleware.ts` si ya tienes uno, y suma
  tus rutas privadas a `RUTAS_PRIVADAS` y al `matcher`.
- En cualquier página del servidor puedes usar `await requerirUsuario()` para exigir sesión y
  `estaActiva(usuario.subscription)` para exigir suscripción vigente.

## Seguridad

- Contraseñas con bcrypt (12 rondas); los tokens de recuperación se guardan hasheados con SHA-256.
- Sesión firmada con HS256, cookie `httpOnly`, `sameSite=lax` y `secure` en producción.
- Límite de intentos en memoria para login y recuperación (`src/lib/limite.ts`); si despliegas
  varias instancias, cámbialo por Redis.
- La recuperación responde siempre igual exista o no la cuenta, para no filtrar correos registrados.
