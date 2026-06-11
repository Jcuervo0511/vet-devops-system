# Experimentos de ingeniería del caos

## Objetivo

Validar que la API veterinaria mantiene un comportamiento controlado ante
latencia, errores HTTP transitorios y consumo creciente de memoria. Las rutas
`/chaos/status` y `/chaos/reset` permiten observar y limpiar los experimentos.
La inyección puede ejecutarse sobre cualquier endpoint existente. Durante la
demostración se usan endpoints `GET`, por lo que no se modifican los datos de
owners, pets o appointments.

El interceptor también está registrado globalmente. Esto permite inyectar caos
en cualquier endpoint existente sin modificar su controlador, servicio o
módulo.

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

## Inyección en cualquier endpoint

### Cómo funciona

No se necesitan decoradores como `@UseInterceptors()`, cambios en los
controladores ni importaciones adicionales en los módulos funcionales.
`ChaosModule` registra `ChaosInjectionInterceptor` como un `APP_INTERCEPTOR`
global. Por esta razón, todas las solicitudes HTTP pasan primero por el
interceptor, pero este permanece inactivo cuando no recibe el encabezado
`x-chaos-scenario`.

El flujo de una solicitud normal es:

```text
Cliente
  -> ChaosInjectionInterceptor
  -> no existe x-chaos-scenario
  -> controlador original
  -> servicio original
  -> respuesta original
```

El flujo de una solicitud con caos es:

```text
Cliente
  -> ChaosInjectionInterceptor
  -> valida x-chaos-scenario
  -> valida CHAOS_ENABLED
  -> valida x-chaos-key
  -> inyecta el escenario
  -> controlador original, cuando el escenario lo permite
  -> respuesta original o error controlado
```

Esto permite usar los escenarios sobre endpoints actuales como:

```text
GET    /owners
GET    /owners/:id
POST   /owners
GET    /pets
GET    /pets/:id
GET    /appointments
PATCH  /appointments/:id
GET    /api/v2/health
```

Para la demostración se recomienda usar endpoints `GET`. Así no se altera
información de la base de datos y la prueba puede repetirse varias veces con el
mismo resultado.

### Encabezados de control

La inyección se controla con estos encabezados:

| Encabezado | Obligatorio | Ejemplo | Función |
|---|---:|---|---|
| `x-chaos-scenario` | Sí | `latency` | Selecciona el escenario que se ejecutará |
| `x-chaos-key` | Sí | `change-this-key` | Autoriza la ejecución del escenario |
| `Content-Type` | Solo si hay body | `application/json` | Conserva el formato normal del endpoint |

Valores admitidos para `x-chaos-scenario`:

| Valor | Efecto |
|---|---|
| `latency` | Introduce la latencia configurada en `CHAOS_DELAY_MS` |
| `transient-error` | Genera un error HTTP 503 en el primer intento |
| `memory` | Asigna la cantidad configurada en `CHAOS_MEMORY_MB` |

Los valores son exactos. Por ejemplo, `Latency`, `error`, `503` o
`memory-leak` no son válidos.

### Encabezados de evidencia

Cuando el escenario se acepta, la respuesta incluye información adicional:

| Encabezado de respuesta | Escenario | Significado |
|---|---|---|
| `x-chaos-scenario` | Todos | Confirma cuál escenario fue inyectado |
| `x-chaos-attempts` | `transient-error` | Indica cuántos intentos fueron realizados |
| `x-chaos-retained-bytes` | `memory` | Indica cuántos bytes permanecen retenidos |

Para ver estos encabezados se debe usar `curl -i` o `curl -D -`.

```bash
curl -i \
  -H "x-chaos-key: change-this-key" \
  -H "x-chaos-scenario: memory" \
  http://localhost:3000/appointments
```

### Variables de entorno

| Variable | Valor sugerido | Descripción |
|---|---|---|
| `CHAOS_ENABLED` | `true` | Habilita el uso de los experimentos |
| `CHAOS_PROTECTION_ENABLED` | `false` o `true` | Selecciona el comportamiento vulnerable o protegido |
| `CHAOS_KEY` | Una clave privada | Autoriza las peticiones que solicitan caos |
| `CHAOS_DELAY_MS` | `3000` | Duración de la latencia en milisegundos |
| `CHAOS_MEMORY_MB` | `1` | Memoria asignada por cada petición del escenario |

La diferencia entre los dos modos es:

```text
CHAOS_PROTECTION_ENABLED=false
  -> reproduce el problema
  -> permite obtener la evidencia inicial

CHAOS_PROTECTION_ENABLED=true
  -> aplica la solución
  -> permite repetir la misma prueba
  -> demuestra que la causa raíz fue tratada
```

`CHAOS_ENABLED=false` no significa modo protegido. Significa que no se permite
ejecutar ningún experimento. Para comparar el antes y el después,
`CHAOS_ENABLED` debe permanecer en `true`; solo debe cambiar
`CHAOS_PROTECTION_ENABLED`.

### Seleccionar el endpoint objetivo

Un endpoint objetivo se compone de:

```text
METHOD + BASE_URL + PATH + QUERY_STRING
```

Ejemplos:

```text
GET http://localhost:3000/owners
GET http://localhost:3000/pets/UUID
GET http://localhost:3000/appointments?status=scheduled
```

La URL completa se puede guardar en una variable:

```bash
export BASE_URL=http://localhost:3000
export CHAOS_TARGET_URL="$BASE_URL/owners"
export CHAOS_KEY=change-this-key
```

Después se usa la variable en la petición:

```bash
curl -i \
  -H "x-chaos-key: $CHAOS_KEY" \
  -H "x-chaos-scenario: latency" \
  "$CHAOS_TARGET_URL"
```

Para cambiar de endpoint no es necesario modificar código:

```bash
export CHAOS_TARGET_URL="$BASE_URL/pets"
```

### Plantilla genérica con `curl`

Esta plantilla sirve para cualquier endpoint `GET`:

```bash
curl --silent --show-error --include \
  --header "x-chaos-key: $CHAOS_KEY" \
  --header "x-chaos-scenario: SCENARIO" \
  --write-out "\nhttp_status=%{http_code}\ntotal_seconds=%{time_total}\n" \
  "$CHAOS_TARGET_URL"
```

Se deben reemplazar:

```text
SCENARIO         -> latency, transient-error o memory
CHAOS_TARGET_URL -> URL completa del endpoint
CHAOS_KEY        -> mismo valor configurado en la API
```

Ejemplo completo:

```bash
BASE_URL=http://localhost:3000
CHAOS_TARGET_URL="$BASE_URL/owners"
CHAOS_KEY=change-this-key

curl --silent --show-error --include \
  --header "x-chaos-key: $CHAOS_KEY" \
  --header "x-chaos-scenario: latency" \
  --write-out "\nhttp_status=%{http_code}\ntotal_seconds=%{time_total}\n" \
  "$CHAOS_TARGET_URL"
```

### Plantilla para endpoints con parámetros

Para un endpoint como `GET /owners/:id`:

```bash
OWNER_ID="UUID_EXISTENTE"

curl --silent --show-error --include \
  --header "x-chaos-key: $CHAOS_KEY" \
  --header "x-chaos-scenario: latency" \
  "$BASE_URL/owners/$OWNER_ID"
```

El identificador debe existir. Si no existe, la latencia se inyecta, pero el
resultado final seguirá siendo el `404` normal del endpoint.

### Plantilla para endpoints con query parameters

```bash
curl --silent --show-error --include \
  --get \
  --data-urlencode "status=scheduled" \
  --header "x-chaos-key: $CHAOS_KEY" \
  --header "x-chaos-scenario: latency" \
  "$BASE_URL/appointments"
```

Los parámetros normales continúan llegando al controlador. El interceptor no
los elimina ni los modifica.

### Plantilla para endpoints con body

Aunque es posible inyectar caos en métodos `POST`, `PUT` o `PATCH`, se recomienda
usar lecturas `GET` durante la demostración. Si se necesita probar un endpoint
con body, se deben conservar sus encabezados y datos normales:

```bash
curl --silent --show-error --include \
  --request POST \
  --header "Content-Type: application/json" \
  --header "x-chaos-key: $CHAOS_KEY" \
  --header "x-chaos-scenario: latency" \
  --data '{
    "fullName": "Chaos Test",
    "email": "chaos-test@example.com",
    "phone_number": "3000000000"
  }' \
  "$BASE_URL/owners"
```

Consideraciones:

- `latency` termina ejecutando el endpoint después del retraso.
- `memory` termina ejecutando el endpoint después de asignar memoria.
- `transient-error` vulnerable responde 503 antes de ejecutar el endpoint.
- `transient-error` protegido ejecuta el endpoint en el segundo intento.
- Las escrituras pueden cambiar datos y requieren limpieza posterior.
- Para una demostración repetible, es preferible usar `GET`.

### Verificar primero el estado estable

Antes de inyectar caos se debe comprobar el comportamiento normal del mismo
endpoint. Esta medición sirve como línea base.

```bash
curl --silent --show-error \
  --output /tmp/owners-baseline.json \
  --write-out "status=%{http_code} seconds=%{time_total}\n" \
  "$BASE_URL/owners"
```

Ver el cuerpo:

```bash
jq . /tmp/owners-baseline.json
```

Registrar como mínimo:

```text
- Fecha y hora
- Endpoint
- Método HTTP
- Código HTTP
- Tiempo total
- Cuerpo de respuesta
```

Luego se ejecuta el mismo endpoint con los dos encabezados de caos. La única
diferencia entre la línea base y el experimento debe ser la inyección
solicitada.

### Verificar que una petición normal no recibe caos

Incluso con `CHAOS_ENABLED=true`, una petición sin `x-chaos-scenario` debe
funcionar normalmente:

```bash
curl -i "$BASE_URL/owners"
```

En esa respuesta no deben aparecer:

```text
x-chaos-scenario
x-chaos-attempts
x-chaos-retained-bytes
```

Esto demuestra que el interceptor no afecta tráfico que no solicita un
experimento.

### Probar una clave inválida

```bash
curl -i \
  -H "x-chaos-key: incorrect-key" \
  -H "x-chaos-scenario: latency" \
  "$BASE_URL/owners"
```

Resultado esperado:

```text
HTTP 403 Forbidden
Invalid chaos key
```

### Probar sin clave

```bash
curl -i \
  -H "x-chaos-scenario: latency" \
  "$BASE_URL/owners"
```

Resultado esperado:

```text
HTTP 403 Forbidden
Invalid chaos key
```

### Probar un escenario inválido

```bash
curl -i \
  -H "x-chaos-key: $CHAOS_KEY" \
  -H "x-chaos-scenario: unknown" \
  "$BASE_URL/owners"
```

Resultado esperado:

```text
HTTP 400 Bad Request
x-chaos-scenario must be latency, transient-error or memory
```

### Probar con los experimentos deshabilitados

Configurar:

```env
CHAOS_ENABLED=false
```

Recrear la API y enviar una petición con escenario:

```bash
docker compose up -d --force-recreate api

curl -i \
  -H "x-chaos-key: $CHAOS_KEY" \
  -H "x-chaos-scenario: latency" \
  "$BASE_URL/owners"
```

Resultado esperado:

```text
HTTP 404 Not Found
Chaos experiments are disabled
```

Una petición normal sin `x-chaos-scenario` debe continuar respondiendo aunque
`CHAOS_ENABLED=false`.

## Preparación local

### Requisitos

Se necesita:

- Docker Engine o Docker Desktop con integración WSL.
- Docker Compose v2.
- `curl`.
- Node.js y npm para ejecutar los scripts del repositorio.
- `jq` es opcional, pero ayuda a leer respuestas JSON.

Comprobar herramientas:

```bash
docker --version
docker compose version
node --version
npm --version
curl --version
jq --version
```

### Crear el archivo `.env`

Crear `.env` en la raíz del proyecto. Para Docker Compose, el host de PostgreSQL
es `db`, porque ese es el nombre del servicio dentro de la red de Compose:

```env
DATABASE_URL=postgresql://postgres:postgres@db:5432/vet_db
PORT=3000
CHAOS_ENABLED=true
CHAOS_PROTECTION_ENABLED=false
CHAOS_KEY=change-this-key
CHAOS_DELAY_MS=3000
CHAOS_MEMORY_MB=1
```

No se debe usar `localhost:5433` dentro del contenedor de la API. Esa dirección
solo sirve para conectarse a PostgreSQL desde el sistema anfitrión.

### Levantar el sistema

Construir e iniciar PostgreSQL y la API:

```bash
docker compose up --build -d
```

Verificar el estado:

```bash
docker compose ps
```

Los servicios deben aparecer como `Up`.

Ver los logs de la API:

```bash
docker compose logs --tail=100 api
```

Seguir los logs en tiempo real:

```bash
docker compose logs -f api
```

### Confirmar que la API responde

```bash
curl --silent --show-error --include \
  http://localhost:3000/api/v2/health
```

Resultado esperado:

```text
HTTP/1.1 200 OK
```

### Confirmar las variables dentro del contenedor

```bash
docker compose exec api env | sort | grep '^CHAOS_'
```

Debe aparecer:

```text
CHAOS_DELAY_MS=3000
CHAOS_ENABLED=true
CHAOS_KEY=change-this-key
CHAOS_MEMORY_MB=1
CHAOS_PROTECTION_ENABLED=false
```

Si los valores no coinciden con `.env`, recrear la API:

```bash
docker compose up -d --force-recreate api
```

Reiniciar sin `--force-recreate` puede conservar variables anteriores en el
contenedor.

### Variables útiles para la terminal

```bash
export BASE_URL=http://localhost:3000
export CHAOS_KEY=change-this-key
```

Estas variables son usadas por los ejemplos siguientes. Cambiar `BASE_URL`
permite ejecutar exactamente las mismas pruebas en staging.

## Escenario 1: latencia en cascada

### Objetivo

Demostrar que una operación síncrona lenta dentro de una aplicación Node.js
puede bloquear el event loop y retrasar solicitudes no relacionadas.

### Hipótesis

Si `GET /owners` ejecuta una espera síncrona de tres segundos, una solicitud
simultánea a `GET /api/v2/health` también quedará detenida. Si la espera se
implementa de forma asíncrona, `/owners` conservará la latencia intencional,
pero `/api/v2/health` continuará respondiendo inmediatamente.

### Estado estable

Antes del experimento:

```text
GET /owners        -> HTTP 200
GET /api/v2/health -> HTTP 200 en menos de 500 ms
```

Medir la línea base:

```bash
curl --silent --show-error \
  --output /tmp/owners-baseline.json \
  --write-out "owners_status=%{http_code} owners_seconds=%{time_total}\n" \
  "$BASE_URL/owners"

curl --silent --show-error \
  --output /tmp/health-baseline.json \
  --write-out "health_status=%{http_code} health_seconds=%{time_total}\n" \
  "$BASE_URL/api/v2/health"
```

Guardar los cuerpos para compararlos:

```bash
jq . /tmp/owners-baseline.json
jq . /tmp/health-baseline.json
```

### Configurar el modo vulnerable

En `.env`:

```env
CHAOS_ENABLED=true
CHAOS_PROTECTION_ENABLED=false
CHAOS_KEY=change-this-key
CHAOS_DELAY_MS=3000
```

Aplicar la configuración:

```bash
docker compose up -d --force-recreate api
```

Confirmarla:

```bash
docker compose exec api env | grep '^CHAOS_'
```

### Ejecutar manualmente desde dos terminales

En la terminal 1:

```bash
curl --silent --show-error --include \
  --header "x-chaos-key: $CHAOS_KEY" \
  --header "x-chaos-scenario: latency" \
  --write-out "\nowners_status=%{http_code} owners_seconds=%{time_total}\n" \
  "$BASE_URL/owners"
```

Inmediatamente después, mientras la primera petición sigue esperando, ejecutar
en la terminal 2:

```bash
curl --silent --show-error \
  --output /tmp/health-during-chaos.json \
  --write-out "health_status=%{http_code} health_seconds=%{time_total}\n" \
  "$BASE_URL/api/v2/health"
```

La segunda orden debe iniciarse antes de que terminen los tres segundos de la
primera.

### Ejecutar manualmente desde una sola terminal

Esta variante garantiza que las dos solicitudes se superpongan:

```bash
curl --silent --show-error \
  --header "x-chaos-key: $CHAOS_KEY" \
  --header "x-chaos-scenario: latency" \
  --output /tmp/owners-chaos.json \
  --write-out "owners_status=%{http_code} owners_seconds=%{time_total}\n" \
  "$BASE_URL/owners" &

CHAOS_PID=$!
sleep 0.2

curl --silent --show-error \
  --output /tmp/health-during-chaos.json \
  --write-out "health_status=%{http_code} health_seconds=%{time_total}\n" \
  "$BASE_URL/api/v2/health"

wait "$CHAOS_PID"
```

### Resultado vulnerable esperado

Con una espera de 3000 ms:

```text
owners_status=200 owners_seconds≈3.0
health_status=200 health_seconds≈2.8
```

Health tarda un poco menos porque se inicia 200 ms después de `/owners`.

La respuesta de `/owners` debe conservar su contenido normal. Se puede comparar
con la línea base:

```bash
diff -u /tmp/owners-baseline.json /tmp/owners-chaos.json
```

Si no hubo cambios en la base de datos, `diff` no debe mostrar diferencias.

### Evidencia del evento

La evidencia debe demostrar simultáneamente:

```text
1. /owners tardó aproximadamente 3 segundos.
2. /api/v2/health también se retrasó.
3. Health no recibió encabezados de caos.
4. El cuerpo de /owners siguió siendo el cuerpo original.
```

El retraso de health demuestra que el problema no está aislado al endpoint
objetivo.

### Causa raíz

En modo vulnerable el interceptor ejecuta un ciclo síncrono:

```text
while Date.now() sea menor que el tiempo final:
  mantener ocupado el hilo principal
```

Node.js atiende JavaScript en el event loop principal. Mientras ese hilo está
ocupado, no puede procesar nuevas solicitudes HTTP, aunque pertenezcan a otros
controladores.

### Activar la solución

Cambiar solamente:

```env
CHAOS_PROTECTION_ENABLED=true
```

No cambiar `CHAOS_ENABLED`, `CHAOS_DELAY_MS`, endpoint, encabezados ni comandos.
La comparación requiere repetir exactamente el mismo experimento.

Recrear la API:

```bash
docker compose up -d --force-recreate api
```

Confirmar:

```bash
docker compose exec api env | grep CHAOS_PROTECTION_ENABLED
```

Resultado esperado:

```text
CHAOS_PROTECTION_ENABLED=true
```

### Repetir con la solución

Ejecutar nuevamente el bloque de una sola terminal:

```bash
curl --silent --show-error \
  --header "x-chaos-key: $CHAOS_KEY" \
  --header "x-chaos-scenario: latency" \
  --output /tmp/owners-protected.json \
  --write-out "owners_status=%{http_code} owners_seconds=%{time_total}\n" \
  "$BASE_URL/owners" &

CHAOS_PID=$!
sleep 0.2

curl --silent --show-error \
  --output /tmp/health-protected.json \
  --write-out "health_status=%{http_code} health_seconds=%{time_total}\n" \
  "$BASE_URL/api/v2/health"

wait "$CHAOS_PID"
```

### Resultado protegido esperado

```text
owners_status=200 owners_seconds≈3.0
health_status=200 health_seconds<0.5
```

`/owners` sigue tardando tres segundos porque el escenario continúa activo. La
diferencia es que el retraso usa RxJS de forma asíncrona y libera el event loop
para atender health.

### Criterios de aceptación

El escenario queda resuelto cuando:

- `/owners` conserva la latencia solicitada.
- `/owners` conserva su código y cuerpo normales.
- `/api/v2/health` responde en menos de 500 ms durante la espera.
- La misma orden vulnerable y protegida produce una diferencia medible.
- No fue necesario modificar `OwnersController`.

### Ejecutar con el script

El script automatiza la concurrencia y guarda evidencia:

```bash
CHAOS_TARGET_URL="$BASE_URL/owners" \
CHAOS_KEY="$CHAOS_KEY" \
npm run chaos:latency
```

Salida vulnerable esperada:

```text
chaos_status=200 chaos_seconds≈3.0
health_status=200 health_seconds≈2.8
```

Salida protegida esperada:

```text
chaos_status=200 chaos_seconds≈3.0
health_status=200 health_seconds<0.5
```

## Escenario 2: error HTTP transitorio

### Objetivo

Demostrar el efecto de una falla temporal HTTP 503 y comprobar que una política
de reintento limitada puede recuperar una operación de lectura.

### Hipótesis

Sin protección, el primer error 503 se entrega al cliente. Con protección, la
API espera 100 ms, realiza un único reintento y devuelve la respuesta normal de
`GET /pets`.

### Estado estable

```text
GET /pets -> HTTP 200
```

Obtener la línea base:

```bash
curl --silent --show-error \
  --output /tmp/pets-baseline.json \
  --write-out "status=%{http_code} seconds=%{time_total}\n" \
  "$BASE_URL/pets"
```

Ver la respuesta:

```bash
jq . /tmp/pets-baseline.json
```

### Configurar el modo vulnerable

```env
CHAOS_ENABLED=true
CHAOS_PROTECTION_ENABLED=false
CHAOS_KEY=change-this-key
```

Aplicar:

```bash
docker compose up -d --force-recreate api
```

### Inyectar el error

```bash
curl --silent --show-error --include \
  --header "x-chaos-key: $CHAOS_KEY" \
  --header "x-chaos-scenario: transient-error" \
  --write-out "\nhttp_status=%{http_code}\ntotal_seconds=%{time_total}\n" \
  "$BASE_URL/pets"
```

### Resultado vulnerable esperado

```text
HTTP/1.1 503 Service Unavailable
x-chaos-scenario: transient-error
x-chaos-attempts: 1

{
  "message": "Transient chaos error",
  "error": "Service Unavailable",
  "statusCode": 503
}
```

El controlador de pets no se ejecuta en ese primer intento, porque el
interceptor genera el error antes de llamar al endpoint.

### Evidencia del evento

Guardar encabezados, cuerpo y métricas por separado:

```bash
curl --silent --show-error \
  --dump-header /tmp/transient-vulnerable.headers \
  --output /tmp/transient-vulnerable.json \
  --header "x-chaos-key: $CHAOS_KEY" \
  --header "x-chaos-scenario: transient-error" \
  --write-out "status=%{http_code} seconds=%{time_total}\n" \
  "$BASE_URL/pets"
```

Revisar:

```bash
cat /tmp/transient-vulnerable.headers
jq . /tmp/transient-vulnerable.json
```

Se debe registrar:

```text
- HTTP 503.
- x-chaos-attempts: 1.
- Mensaje Transient chaos error.
- Tiempo de respuesta.
```

### Causa raíz

El sistema vulnerable no tiene una política para recuperar una falla temporal.
Aunque el siguiente intento podría funcionar, la primera excepción se entrega
directamente al cliente.

### Activar la solución

Cambiar:

```env
CHAOS_PROTECTION_ENABLED=true
```

Recrear:

```bash
docker compose up -d --force-recreate api
```

### Repetir exactamente la misma petición

```bash
curl --silent --show-error \
  --dump-header /tmp/transient-protected.headers \
  --output /tmp/transient-protected.json \
  --header "x-chaos-key: $CHAOS_KEY" \
  --header "x-chaos-scenario: transient-error" \
  --write-out "status=%{http_code} seconds=%{time_total}\n" \
  "$BASE_URL/pets"
```

Revisar:

```bash
cat /tmp/transient-protected.headers
jq . /tmp/transient-protected.json
```

### Resultado protegido esperado

```text
HTTP/1.1 200 OK
x-chaos-scenario: transient-error
x-chaos-attempts: 2
```

El cuerpo debe ser igual al resultado normal de `/pets`, por ejemplo:

```json
[]
```

El número de intentos se informa en el encabezado, no se agrega al JSON del
endpoint. Esto evita modificar el contrato original de la API.

Comparar el cuerpo protegido con la línea base:

```bash
diff -u /tmp/pets-baseline.json /tmp/transient-protected.json
```

Si los datos no cambiaron durante la prueba, no debe haber diferencias.

### Funcionamiento de la solución

El flujo protegido es:

```text
Intento 1
  -> se inyecta ServiceUnavailableException
  -> espera 100 ms

Intento 2
  -> no se vuelve a inyectar el error
  -> se ejecuta GET /pets
  -> se devuelve HTTP 200
```

El reintento está limitado a una sola repetición. No existe un ciclo infinito.

### Seguridad del método HTTP

Para la entrega se recomienda aplicar este escenario únicamente a `GET`:

```text
GET /owners
GET /pets
GET /appointments
```

Aunque el escenario inyectado falla antes de ejecutar el primer intento, usar
operaciones de lectura hace más clara la demostración y evita depender de
efectos secundarios o limpieza de datos.

### Criterios de aceptación

- Vulnerable: HTTP 503 y `x-chaos-attempts: 1`.
- Protegido: HTTP 200 y `x-chaos-attempts: 2`.
- El cuerpo protegido coincide con el cuerpo normal de `/pets`.
- El reintento agrega aproximadamente 100 ms, no varios segundos.
- No se modificó `PetsController`.

### Ejecutar con el script

```bash
CHAOS_TARGET_URL="$BASE_URL/pets" \
CHAOS_KEY="$CHAOS_KEY" \
npm run chaos:transient
```

Salida vulnerable:

```text
http_status=503
chaos_attempts=1
```

Salida protegida:

```text
http_status=200
chaos_attempts=2
```

## Escenario 3: fuga de memoria

### Objetivo

Demostrar cómo una referencia conservada después de cada solicitud produce
crecimiento acumulativo de memoria.

### Hipótesis

Si cada llamada a `GET /appointments` conserva un buffer de 1 MB, después de 20
peticiones existirán 20 MB retenidos. Si el buffer no se guarda en una
colección de larga duración, las mismas 20 peticiones dejarán cero bytes
retenidos por el experimento.

### Métrica principal

La métrica determinística es:

```text
retainedBytes
```

También se muestran:

```text
rss
heapUsed
external
```

Estas métricas del proceso pueden variar por el recolector de basura, TypeORM,
NestJS y Node.js. No deben usarse como único criterio. La prueba se aprueba o
falla usando `retainedBlocks` y `retainedBytes`.

### Estado estable

Consultar el estado:

```bash
curl --silent --show-error \
  --header "x-chaos-key: $CHAOS_KEY" \
  "$BASE_URL/chaos/status" | jq .
```

Si existen datos de una prueba anterior, limpiar:

```bash
curl --silent --show-error \
  --request DELETE \
  --header "x-chaos-key: $CHAOS_KEY" \
  "$BASE_URL/chaos/reset" | jq .
```

Confirmar:

```json
{
  "retainedBlocks": 0,
  "retainedBytes": 0
}
```

### Configurar el modo vulnerable

```env
CHAOS_ENABLED=true
CHAOS_PROTECTION_ENABLED=false
CHAOS_KEY=change-this-key
CHAOS_MEMORY_MB=1
```

Aplicar:

```bash
docker compose up -d --force-recreate api
```

### Ejecutar una sola petición

```bash
curl --silent --show-error --include \
  --header "x-chaos-key: $CHAOS_KEY" \
  --header "x-chaos-scenario: memory" \
  "$BASE_URL/appointments"
```

Encabezados esperados:

```text
x-chaos-scenario: memory
x-chaos-retained-bytes: 1048576
```

`1048576` bytes equivalen a 1 MB binario:

```text
1 * 1024 * 1024 = 1048576
```

La respuesta debe conservar el cuerpo original de `/appointments`.

### Ejecutar 20 peticiones

Limpiar primero:

```bash
curl --silent --show-error \
  --request DELETE \
  --header "x-chaos-key: $CHAOS_KEY" \
  "$BASE_URL/chaos/reset" | jq .
```

Ejecutar:

```bash
for request_number in $(seq 1 20); do
  curl --silent --show-error \
    --output /dev/null \
    --header "x-chaos-key: $CHAOS_KEY" \
    --header "x-chaos-scenario: memory" \
    "$BASE_URL/appointments"

  echo "Solicitud $request_number completada"
done
```

Consultar:

```bash
curl --silent --show-error \
  --header "x-chaos-key: $CHAOS_KEY" \
  "$BASE_URL/chaos/status" | jq .
```

### Resultado vulnerable esperado

```json
{
  "protectionEnabled": false,
  "retainedBlocks": 20,
  "retainedBytes": 20971520
}
```

Cálculo:

```text
20 solicitudes * 1 MB * 1024 * 1024 = 20971520 bytes
```

### Evidencia incremental

Para mostrar el crecimiento petición por petición:

```bash
curl --silent --show-error \
  --request DELETE \
  --header "x-chaos-key: $CHAOS_KEY" \
  "$BASE_URL/chaos/reset" > /dev/null

for request_number in $(seq 1 5); do
  curl --silent --show-error \
    --dump-header /tmp/memory-$request_number.headers \
    --output /dev/null \
    --header "x-chaos-key: $CHAOS_KEY" \
    --header "x-chaos-scenario: memory" \
    "$BASE_URL/appointments"

  retained_bytes="$(
    awk 'tolower($1) == "x-chaos-retained-bytes:" {
      gsub("\r", "", $2);
      print $2
    }' /tmp/memory-$request_number.headers
  )"

  echo "request=$request_number retained_bytes=$retained_bytes"
done
```

Salida esperada:

```text
request=1 retained_bytes=1048576
request=2 retained_bytes=2097152
request=3 retained_bytes=3145728
request=4 retained_bytes=4194304
request=5 retained_bytes=5242880
```

### Causa raíz

En modo vulnerable cada buffer se agrega a una colección que vive durante toda
la ejecución del proceso. Aunque la petición termina, la colección mantiene la
referencia y el recolector de basura no puede liberar ese bloque.

### Activar la solución

Cambiar:

```env
CHAOS_PROTECTION_ENABLED=true
```

Recrear:

```bash
docker compose up -d --force-recreate api
```

Limpiar antes de repetir:

```bash
curl --silent --show-error \
  --request DELETE \
  --header "x-chaos-key: $CHAOS_KEY" \
  "$BASE_URL/chaos/reset" | jq .
```

### Repetir las mismas 20 peticiones

```bash
for request_number in $(seq 1 20); do
  curl --silent --show-error \
    --output /dev/null \
    --header "x-chaos-key: $CHAOS_KEY" \
    --header "x-chaos-scenario: memory" \
    "$BASE_URL/appointments"
done
```

Consultar:

```bash
curl --silent --show-error \
  --header "x-chaos-key: $CHAOS_KEY" \
  "$BASE_URL/chaos/status" | jq .
```

### Resultado protegido esperado

```json
{
  "protectionEnabled": true,
  "retainedBlocks": 0,
  "retainedBytes": 0
}
```

La aplicación sí crea el buffer para mantener el mismo estímulo, pero no
conserva la referencia después de la operación. Por eso los contadores
controlados permanecen en cero.

### Criterios de aceptación

- Vulnerable: 20 bloques y 20,971,520 bytes retenidos.
- Protegido: cero bloques y cero bytes retenidos.
- `/appointments` conserva su respuesta normal.
- Las dos pruebas usan 20 solicitudes y 1 MB por solicitud.
- No se modificó `AppointmentsController`.

### Ejecutar con el script

```bash
CHAOS_TARGET_URL="$BASE_URL/appointments" \
CHAOS_KEY="$CHAOS_KEY" \
REQUESTS=20 \
npm run chaos:memory
```

El script:

```text
1. Limpia el estado anterior.
2. Ejecuta el número configurado de solicitudes.
3. Consulta /chaos/status.
4. Guarda la salida en docs/evidence/local.
```

### Limpieza final

```bash
curl --silent --show-error \
  --request DELETE \
  --header "x-chaos-key: $CHAOS_KEY" \
  "$BASE_URL/chaos/reset" | jq .
```

Para apagar completamente los experimentos:

```env
CHAOS_ENABLED=false
CHAOS_PROTECTION_ENABLED=true
```

```bash
docker compose up -d --force-recreate api
```

## Repetición después de la solución

### Regla principal

Para demostrar que la solución funciona se debe repetir el mismo estímulo. No
se deben cambiar simultáneamente el endpoint, el número de solicitudes, la
latencia, el tamaño de memoria o los encabezados.

Entre la prueba vulnerable y protegida solo debe cambiar:

```env
CHAOS_PROTECTION_ENABLED=true
```

Las demás variables deben permanecer iguales:

```env
CHAOS_ENABLED=true
CHAOS_KEY=change-this-key
CHAOS_DELAY_MS=3000
CHAOS_MEMORY_MB=1
```

### Protocolo completo

#### 1. Preparar variables de terminal

```bash
export BASE_URL=http://localhost:3000
export CHAOS_KEY=change-this-key
```

#### 2. Configurar modo vulnerable

```env
CHAOS_ENABLED=true
CHAOS_PROTECTION_ENABLED=false
CHAOS_KEY=change-this-key
CHAOS_DELAY_MS=3000
CHAOS_MEMORY_MB=1
```

#### 3. Recrear la API vulnerable

```bash
docker compose up -d --force-recreate api
```

#### 4. Esperar a que health responda

```bash
until curl --silent --fail "$BASE_URL/api/v2/health" > /dev/null; do
  echo "Esperando API..."
  sleep 1
done

echo "API disponible"
```

#### 5. Ejecutar los tres escenarios vulnerables

```bash
CHAOS_TARGET_URL="$BASE_URL/owners" \
CHAOS_KEY="$CHAOS_KEY" \
npm run chaos:latency

CHAOS_TARGET_URL="$BASE_URL/pets" \
CHAOS_KEY="$CHAOS_KEY" \
npm run chaos:transient

CHAOS_TARGET_URL="$BASE_URL/appointments" \
CHAOS_KEY="$CHAOS_KEY" \
REQUESTS=20 \
npm run chaos:memory
```

#### 6. Anotar resultados vulnerables

Registrar:

```text
Latencia:
  - Tiempo de /owners.
  - Tiempo de /api/v2/health.

Error transitorio:
  - Código HTTP.
  - Número de intentos.

Memoria:
  - retainedBlocks.
  - retainedBytes.
```

#### 7. Activar protección

Modificar `.env`:

```env
CHAOS_PROTECTION_ENABLED=true
```

#### 8. Recrear únicamente la API

```bash
docker compose up -d --force-recreate api
```

No es necesario borrar el volumen de PostgreSQL.

#### 9. Confirmar el modo protegido

```bash
docker compose exec api env | grep CHAOS_PROTECTION_ENABLED
```

Debe mostrar:

```text
CHAOS_PROTECTION_ENABLED=true
```

#### 10. Esperar nuevamente a health

```bash
until curl --silent --fail "$BASE_URL/api/v2/health" > /dev/null; do
  echo "Esperando API..."
  sleep 1
done
```

#### 11. Repetir exactamente los mismos scripts

```bash
CHAOS_TARGET_URL="$BASE_URL/owners" \
CHAOS_KEY="$CHAOS_KEY" \
npm run chaos:latency

CHAOS_TARGET_URL="$BASE_URL/pets" \
CHAOS_KEY="$CHAOS_KEY" \
npm run chaos:transient

CHAOS_TARGET_URL="$BASE_URL/appointments" \
CHAOS_KEY="$CHAOS_KEY" \
REQUESTS=20 \
npm run chaos:memory
```

#### 12. Comparar

| Variable del experimento | Vulnerable | Protegido |
|---|---|---|
| Endpoint de latencia | `/owners` | `/owners` |
| Duración | 3000 ms | 3000 ms |
| Endpoint de error | `/pets` | `/pets` |
| Reintentos configurados | Sin recuperación | Uno |
| Endpoint de memoria | `/appointments` | `/appointments` |
| Solicitudes | 20 | 20 |
| Memoria por solicitud | 1 MB | 1 MB |

Si uno de estos valores cambia, la comparación deja de ser equivalente.

### Archivos de evidencia

Cada script crea un archivo con fecha y hora:

```text
docs/evidence/local/latency-YYYYMMDD-HHMMSS.txt
docs/evidence/local/transient-error-YYYYMMDD-HHMMSS.txt
docs/evidence/local/memory-leak-YYYYMMDD-HHMMSS.txt
```

Después de ejecutar ambos modos deben existir al menos seis archivos:

```text
1 latencia vulnerable
1 latencia protegida
1 error vulnerable
1 error protegido
1 memoria vulnerable
1 memoria protegida
```

Listarlos:

```bash
find docs/evidence/local -maxdepth 1 -type f -name '*.txt' | sort
```

Ver el contenido:

```bash
for evidence_file in docs/evidence/local/*.txt; do
  echo "===== $evidence_file ====="
  cat "$evidence_file"
done
```

### Uso desde Postman

También se puede inyectar caos sin usar scripts.

#### Crear una petición normal

```text
Method: GET
URL: http://localhost:3000/owners
```

Enviar la petición y guardar:

```text
Status
Time
Response body
```

#### Agregar los encabezados

En la pestaña `Headers`:

| Key | Value |
|---|---|
| `x-chaos-key` | `change-this-key` |
| `x-chaos-scenario` | `latency` |

Enviar nuevamente. Postman debe mostrar un tiempo cercano a 3000 ms.

#### Cambiar de escenario

Modificar únicamente:

```text
x-chaos-scenario: transient-error
```

o:

```text
x-chaos-scenario: memory
```

#### Revisar encabezados de respuesta

En la sección de headers de la respuesta buscar:

```text
x-chaos-scenario
x-chaos-attempts
x-chaos-retained-bytes
```

#### Variables de entorno de Postman

Crear:

```text
base_url = http://localhost:3000
chaos_key = change-this-key
```

Usar:

```text
URL: {{base_url}}/owners
x-chaos-key: {{chaos_key}}
```

Para staging solo se cambia `base_url`.

### Uso desde Swagger

Swagger sigue mostrando los endpoints de negocio, pero los encabezados del
interceptor global no están declarados individualmente en cada operación. Para
una demostración completa de los encabezados se recomienda `curl` o Postman.

Los endpoints dedicados `/chaos/*` sí muestran `x-chaos-key` porque su
controlador lo declara explícitamente.

## Ejecución en AWS staging

### Consideraciones

- Ejecutar únicamente en staging o canary.
- No habilitar caos en producción.
- Usar una clave diferente a la local.
- Mantener `CHAOS_ENABLED=false` en producción.
- Confirmar que la URL usada apunta al entorno correcto.

### Configuración de GitHub

Configurar estos secretos:

- `CHAOS_ENABLED=true`
- `CHAOS_PROTECTION_ENABLED=false` para la primera demostración
- `CHAOS_KEY` con una clave privada

Configurar estas variables:

- `CHAOS_DELAY_MS=3000`
- `CHAOS_MEMORY_MB=1`

### Desplegar el modo vulnerable

Ejecutar el pipeline de staging con:

```text
CHAOS_ENABLED=true
CHAOS_PROTECTION_ENABLED=false
```

Después del despliegue, definir:

```bash
export BASE_URL=http://STAGING_HOST:8080
export CHAOS_KEY=PRIVATE_KEY
export EVIDENCE_DIR=docs/evidence/cloud
```

Confirmar health:

```bash
curl --silent --show-error --include \
  "$BASE_URL/api/v2/health"
```

Comprobar una petición normal:

```bash
curl --silent --show-error --include \
  "$BASE_URL/owners"
```

### Ejecutar los escenarios en staging

Latencia:

```bash
CHAOS_TARGET_URL="$BASE_URL/owners" \
npm run chaos:latency
```

Error transitorio:

```bash
CHAOS_TARGET_URL="$BASE_URL/pets" \
npm run chaos:transient
```

Memoria:

```bash
CHAOS_TARGET_URL="$BASE_URL/appointments" \
REQUESTS=20 \
npm run chaos:memory
```

Los scripts heredarán `BASE_URL`, `CHAOS_KEY` y `EVIDENCE_DIR` exportados.

### Desplegar el modo protegido

Cambiar el secreto:

```text
CHAOS_PROTECTION_ENABLED=true
```

Desplegar nuevamente la misma versión del código y repetir exactamente las
mismas órdenes.

### Verificación cloud

La evidencia cloud debe contener:

```text
- URL de staging.
- Fecha y hora.
- Resultado vulnerable.
- Resultado protegido.
- Código HTTP.
- Tiempo total.
- Número de intentos.
- Bytes retenidos.
```

### Apagar los experimentos después de la prueba

Configurar:

```text
CHAOS_ENABLED=false
CHAOS_PROTECTION_ENABLED=true
```

Desplegar una última vez y comprobar:

```bash
curl -i \
  -H "x-chaos-key: $CHAOS_KEY" \
  -H "x-chaos-scenario: latency" \
  "$BASE_URL/owners"
```

Resultado:

```text
HTTP 404 Not Found
Chaos experiments are disabled
```

La ruta normal debe continuar funcionando:

```bash
curl -i "$BASE_URL/owners"
```

## Solución de problemas

### La petición responde 403

Posible causa:

```text
x-chaos-key no coincide con CHAOS_KEY
```

Verificar localmente:

```bash
echo "$CHAOS_KEY"
docker compose exec api env | grep CHAOS_KEY
```

Ambos valores deben coincidir exactamente. Evitar espacios al final.

### La petición responde 404 con mensaje de caos deshabilitado

Posible causa:

```text
CHAOS_ENABLED=false
```

Verificar:

```bash
docker compose exec api env | grep CHAOS_ENABLED
```

Corregir `.env` y recrear:

```bash
docker compose up -d --force-recreate api
```

### La petición responde 400

Posible causa:

```text
x-chaos-scenario contiene un valor no soportado
```

Usar exactamente:

```text
latency
transient-error
memory
```

### No ocurre ningún efecto

Comprobar:

```text
1. Existe x-chaos-scenario.
2. La clave es correcta.
3. CHAOS_ENABLED=true.
4. Se recreó el contenedor.
5. La petición apunta a la API correcta.
```

Ver encabezados enviados con curl:

```bash
curl --verbose \
  -H "x-chaos-key: $CHAOS_KEY" \
  -H "x-chaos-scenario: latency" \
  "$BASE_URL/owners"
```

### La latencia afecta health incluso en modo protegido

Verificar:

```bash
docker compose exec api env | grep CHAOS_PROTECTION_ENABLED
```

Debe ser `true`.

También confirmar que el contenedor fue recreado después de modificar `.env`.

### Health no se retrasa en modo vulnerable

La solicitud de health debe ejecutarse mientras la solicitud lenta continúa
activa. Si se ejecuta después de los tres segundos, responderá normalmente.

Usar el script:

```bash
npm run chaos:latency
```

Este inicia health 200 ms después del endpoint objetivo.

### El error protegido sigue devolviendo 503

Comprobar:

```text
CHAOS_PROTECTION_ENABLED=true
x-chaos-scenario=transient-error
```

Recrear la API y repetir:

```bash
docker compose up -d --force-recreate api
npm run chaos:transient
```

### `retainedBytes` no inicia en cero

Existe memoria de una prueba anterior. Limpiar:

```bash
curl --request DELETE \
  --header "x-chaos-key: $CHAOS_KEY" \
  "$BASE_URL/chaos/reset"
```

### `rss` o `external` no bajan inmediatamente

Esto no significa que la solución haya fallado. Node.js puede conservar memoria
reservada para reutilizarla y el recolector de basura no se ejecuta de forma
inmediata.

Evaluar:

```text
retainedBlocks
retainedBytes
```

### Docker Compose muestra variables vacías

Comprobar que `.env` existe en la raíz:

```bash
ls -la .env
```

Comprobar la configuración resuelta:

```bash
docker compose config
```

No publicar el valor real de `CHAOS_KEY` en capturas, commits o documentos.

### La API no inicia

Revisar:

```bash
docker compose ps
docker compose logs --tail=200 api
docker compose logs --tail=200 db
```

Confirmar que la URL interna usa:

```text
postgresql://postgres:postgres@db:5432/vet_db
```

### El puerto 3000 está ocupado

Identificar el proceso:

```bash
ss -ltnp | grep ':3000'
```

Detener el servicio que usa el puerto o cambiar el mapeo de Compose.

### Limpiar el entorno local

Detener contenedores sin borrar datos:

```bash
docker compose down
```

Detener y borrar el volumen de PostgreSQL:

```bash
docker compose down -v
```

`down -v` elimina los datos locales de la base. Usarlo únicamente cuando esa
eliminación sea intencional.

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
| Latencia sobre `/owners` | Endpoint 3.013 s; health 2.810 s | Endpoint 3.019 s; health 0.003 s |
| Error sobre `/pets` | HTTP 503 en 0.004 s | HTTP 200 en 0.109 s; 2 intentos |
| Memoria | 20 bloques; 20,971,520 bytes | 0 bloques; 0 bytes |

Los controladores de owners, pets y appointments no fueron modificados. Los
archivos completos se encuentran en `docs/evidence/local`.
