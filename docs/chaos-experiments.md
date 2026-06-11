# Experimentos de ingeniería del caos

## Objetivo

Validar que la API veterinaria mantiene un comportamiento controlado ante
latencia, errores HTTP transitorios y consumo creciente de memoria. Los
experimentos usan rutas aisladas bajo `/chaos` y no modifican los datos de
owners, pets o appointments.

## Seguridad y configuración

Las rutas solo existen cuando `CHAOS_ENABLED=true` y requieren el encabezado
`x-chaos-key`. La configuración por defecto mantiene los experimentos
deshabilitados.

```env
CHAOS_ENABLED=true
CHAOS_PROTECTION_ENABLED=false
CHAOS_KEY=change-this-key
CHAOS_DELAY_MS=3000
CHAOS_MEMORY_MB=1
```

`CHAOS_PROTECTION_ENABLED=false` reproduce el sistema vulnerable.
`CHAOS_PROTECTION_ENABLED=true` activa las soluciones.

## Preparación local

1. Habilitar la integración WSL de Docker Desktop.
2. Crear `.env` a partir de `.env.example`.
3. Usar esta conexión para el PostgreSQL de Docker Compose:

```env
DATABASE_URL=postgresql://postgres:postgres@db:5432/vet_db
PORT=3000
CHAOS_ENABLED=true
CHAOS_PROTECTION_ENABLED=false
CHAOS_KEY=change-this-key
CHAOS_DELAY_MS=3000
CHAOS_MEMORY_MB=1
```

4. Iniciar la aplicación:

```bash
docker compose up --build -d
```

## Escenario 1: latencia en cascada

**Hipótesis:** una operación síncrona lenta bloquea el event loop de Node.js y
retrasa incluso rutas no relacionadas.

**Estado estable:** `GET /api/v2/health` debe responder en menos de 500 ms.

**Falla:** el interceptor de latencia ejecuta una espera síncrona de 3 segundos.

```bash
npm run chaos:latency
```

En modo vulnerable, `health_seconds` se acerca al tiempo restante del bloqueo.
La causa raíz es el trabajo síncrono dentro del event loop.

**Solución:** el modo protegido usa un retraso asíncrono RxJS. La ruta de caos
sigue tardando 3 segundos, pero no bloquea otras solicitudes.

## Escenario 2: error HTTP transitorio

**Hipótesis:** una falla temporal 503 se entrega al usuario cuando el servicio
no tiene una política de recuperación.

**Estado estable:** una operación de lectura debe finalizar con HTTP 200.

**Falla:** el interceptor devuelve HTTP 503 durante el primer intento.

```bash
npm run chaos:transient
```

En modo vulnerable el resultado es 503. La causa raíz es la ausencia de una
política limitada de reintento para errores recuperables.

**Solución:** el modo protegido reintenta una sola vez, después de 100 ms, y
solo ante `ServiceUnavailableException`. El resultado esperado es HTTP 200 con
`"attempts":2`. No se aplica a escrituras ni a otros tipos de error.

## Escenario 3: fuga de memoria

**Hipótesis:** conservar referencias a buffers después de cada solicitud hace
crecer de forma permanente la memoria del proceso.

**Estado estable:** `retainedBytes` debe permanecer en cero.

**Falla:** cada `POST /chaos/memory` retiene un buffer de 1 MB.

```bash
npm run chaos:memory
```

Con 20 solicitudes vulnerables, el resultado esperado es
`retainedBytes=20971520`. La causa raíz es la colección global que mantiene las
referencias.

**Solución:** el modo protegido procesa el buffer sin guardarlo. Al repetir las
20 solicitudes, `retainedBlocks` y `retainedBytes` permanecen en cero.

## Repetición después de la solución

Cambiar la variable y recrear únicamente la API:

```env
CHAOS_PROTECTION_ENABLED=true
```

```bash
docker compose up -d --force-recreate api
npm run chaos:latency
npm run chaos:transient
npm run chaos:memory
```

Cada script guarda su salida en `docs/evidence/local`. La evidencia debe incluir
una ejecución vulnerable y otra protegida.

## Ejecución en AWS staging

Configurar estos secretos de GitHub:

- `CHAOS_ENABLED=true`
- `CHAOS_PROTECTION_ENABLED=false` para la primera demostración
- `CHAOS_KEY` con una clave privada

Configurar `CHAOS_DELAY_MS=3000` y `CHAOS_MEMORY_MB=1` como variables del
repositorio. Después del despliegue:

```bash
BASE_URL=http://STAGING_HOST:8080 \
CHAOS_KEY=PRIVATE_KEY \
EVIDENCE_DIR=docs/evidence/cloud \
npm run chaos:latency
```

Repetir para los otros scripts. Luego cambiar
`CHAOS_PROTECTION_ENABLED=true`, desplegar de nuevo y repetir las mismas
órdenes. Producción fuerza `CHAOS_ENABLED=false`.

## Evidencia esperada

| Escenario | Vulnerable | Protegido |
|---|---|---|
| Latencia | Health cercano a 3 s | Health menor a 500 ms |
| Error transitorio | HTTP 503 | HTTP 200, 2 intentos |
| Memoria | 20 MB retenidos | 0 bytes retenidos |

## Resultado local validado

La ejecución del 11 de junio de 2026 produjo estos resultados:

| Escenario | Vulnerable | Protegido |
|---|---|---|
| Latencia | Chaos 3.008 s; health 2.808 s | Chaos 3.006 s; health 0.006 s |
| Error transitorio | HTTP 503 en 0.007 s | HTTP 200 en 0.106 s; 2 intentos |
| Memoria | 20 bloques; 20,971,520 bytes | 0 bloques; 0 bytes |

Los archivos completos se encuentran en `docs/evidence/local`.

## IA empleada

Se utilizó OpenAI Codex basado en GPT-5 para inspeccionar la arquitectura
NestJS, proponer los experimentos, generar el código y preparar pruebas y
documentación. Los resultados locales se validan mediante Jest, compilación
TypeScript y ejecución real de los scripts. Los mismos scripts quedan
parametrizados para la validación en staging. La IA no reemplaza la
verificación: los tiempos, códigos HTTP y métricas de memoria guardados son la
evidencia del experimento.
