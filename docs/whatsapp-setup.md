# Guía: WhatsApp API en Producción (Railway)

## Arquitectura

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Admin Panel    │────▶│   API (Railway)   │────▶│ Evolution API   │
│   (Vercel)       │     │   Puerto 3001     │     │ Puerto 8080     │
└─────────────────┘     └──────────────────┘     └────────┬────────┘
                                                          │
                                                   ┌──────▼───────┐
                                                   │  WhatsApp    │
                                                   │  (servidor   │
                                                   │  oficial)    │
                                                   └──────────────┘
```

## Paso 1: Crear servicio Evolution API en Railway

1. Entrá a tu dashboard de **Railway**
2. Click **"+ New"** → **"Docker Image"**
3. En el campo Image, poné: `atendai/evolution-api:latest`
4. En **Settings**:
   - **Port**: `8080`
   - **Healthcheck Path**: `/`
5. En **Variables**, agregá:

```env
SERVER_URL=https://tu-evolution-api.up.railway.app
AUTHENTICATION_API_KEY=futbol-secret-key-cambiar-esto
DATABASE_ENABLED=true
DATABASE_PROVIDER=postgresql
DATABASE_CONNECTION_URI=postgresql://usuario:password@host:5432/futbol_platform
DATABASE_CONNECTION_CLIENT_NAME=evolution
DATABASE_SAVE_DATA_INSTANCE=true
DATABASE_SAVE_DATA_NEW_MESSAGE=true
DATABASE_SAVE_DATA_CONTACTS=true
DATABASE_SAVE_DATA_CHATS=true
LOG_LEVEL=WARN
```

**IMPORTANTE**: El `DATABASE_CONNECTION_URI` debe ser el **mismo** de tu API de futbol-platform (la misma DB).

6. Copiá la URL que Railway te asigna (algo como `https://evolution-api-xxxx.up.railway.app`)

## Paso 2: Configurar variables en tu API de futbol-platform

En Railway,和服务 de **futbol-platform-api**, agregá estas variables:

```env
WHATSAPP_API_URL=https://tu-evolution-api.up.railway.app
WHATSAPP_API_KEY=futbol-secret-key-cambiar-esto
WHATSAPP_INSTANCE=club-futbol
```

## Paso 3: Crear la instancia de WhatsApp en Evolution API

Abrí la consola de Evolution API en tu navegador:
```
https://tu-evolution-api.up.railway.app/manager
```

1. Click **"New Instance"**
2. **Instance Name**: `club-futbol` (debe coincidir con `WHATSAPP_INSTANCE`)
3. **Integration**: `WHATSAPP-BAILEYS`
4. Click **"Create"**
5. **Escaneá el QR code** con WhatsApp en tu celular
6. Esperá a que diga **"Conectado"**

## Paso 4: Verificar la conexión

Desde tu API, hacé un request:

```bash
curl -H "Authorization: Bearer TU_TOKEN_ADMIN" \
  http://localhost:3001/api/v1/whatsapp/status
```

Respuesta esperada:
```json
{ "data": { "connected": true } }
```

## Paso 5: Probar el envío

### Envío individual:
```bash
curl -X POST \
  -H "Authorization: Bearer TU_TOKEN_ADMIN" \
  -H "Content-Type: application/json" \
  -d '{"phone": "5491112345678", "message": "Hola! Test de WhatsApp"}' \
  http://localhost:3001/api/v1/whatsapp/send
```

### Envío a una suscripción:
```bash
curl -X POST \
  -H "Authorization: Bearer TU_TOKEN_ADMIN" \
  -H "Content-Type: application/json" \
  -d '{"type": "player"}' \
  http://localhost:3001/api/v1/whatsapp/send-subscription/SUBSCRIPTION_ID
```

### Envío masivo:
```bash
curl -X POST \
  -H "Authorization: Bearer TU_TOKEN_ADMIN" \
  -H "Content-Type: application/json" \
  -d '{"subscriptionIds": ["sub1", "sub2", "sub3"]}' \
  http://localhost:3001/api/v1/whatsapp/bulk-send-player
```

## Costos

- **Evolution API**: GRATIS (self-hosted)
- **Railway**: El plan Hobby incluye $5/mes de uso. Un servicio mínimo cuesta ~$1/mes
- **WhatsApp**: GRATIS (no hay costo por mensaje con Baileys)

## Limitaciones

- **Número de WhatsApp**: Necesitás un número de teléfono real (puede ser un número secundario)
- **Multi-device**: WhatsApp permite hasta 4 dispositivos conectados
- **Rate limit**: Evitar enviar más de 50 mensajes por hora para no ser bloqueado
- **Reconexión**: Si WhatsApp se desconecta, hay que re-escanear el QR

## Troubleshooting

### "WhatsApp no configurado"
Verificar que las 3 variables estén seteadas: `WHATSAPP_API_URL`, `WHATSAPP_API_KEY`, `WHATSAPP_INSTANCE`

### "Connection closed"
La instancia de WhatsApp se desconectó. Entrar al manager de Evolution API y reconectar.

### "Number not registered"
El número no tiene WhatsApp. Verificar que sea correcto con código de país.

### Evolution API no conecta a la DB
Verificar que el `DATABASE_CONNECTION_URI` apunte a la misma DB que la API.
