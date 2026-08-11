# Guía: WhatsApp Business Cloud API

## Arquitectura

```
┌─────────────────┐     ┌──────────────────┐     ┌──────────────────────────┐
│   Admin Panel    │────▶│   API (Railway)   │────▶│ Meta Cloud API (Graph)   │
│   (Vercel)       │     │   Puerto 3001     │     │ graph.facebook.com/v21.0 │
└─────────────────┘     └──────────────────┘     └─────────────┬────────────┘
                                                               │
                                                        ┌──────▼───────┐
                                                        │  WhatsApp    │
                                                        │  (número     │
                                                        │  del club)   │
                                                        └──────────────┘
```

Reemplaza por completo a Evolution API: no hay servidor propio, QR ni instancia. Meta entrega los
mensajes de plantillas (templates) directamente contra su API. Solo se pueden enviar mensajes
**business-initiated** usando **templates aprobados** (categoría Utility).

## Paso 1: Configuración en Meta (una sola vez)

1. Crear la app de tipo **Business** en https://developers.facebook.com
2. Agregar el producto **WhatsApp** → crear una **WhatsApp Business Account** (WABA)
3. Asociar un **número de teléfono** (en desarrollo se usa el número de prueba de Meta: +1 555...)
4. En **API Setup**, generar el **Token permanente** y copiar:
   - **Phone Number ID** (ej: `1215227851677505`)
   - **Token de acceso** (`EAANZC1...`)
   - **WABA ID** (ej: `1572160644458879`)
   - **App Secret** de la app (para verificar el webhook)

## Paso 2: Crear los templates de cuotas

En WhatsApp Manager → **Message Templates** → **Create**. Categoría **Utility**, idioma **Spanish (es_AR)**.
No usar emojis ni mayúsculas excesivas (Meta las puede rechazar).

| Nombre | Texto | Variables |
|---|---|---|
| `cuota_disponible` | Hola {{1}}, te enviamos el link de pago de la cuota {{2}} de {{3}}. Monto: {{4}}. Link: {{5}} | nombre, periodo ("Agosto 2026"), nombre jugador/club, monto ("$1.000"), link MP |
| `cuota_vencida` | Hola {{1}}, tu cuota de {{2}} está vencida. Abonala lo antes posible. | nombre, periodo |
| `cuota_auspicio` | Hola {{1}}, la cuota de auspicio de {{2}} ({{3}}) ya está disponible. Monto: {{4}}. Comunicate con el club para abonarla. | contacto, periodo, nombre del plan, monto |
| `cuota_auspicio_vencida` | Hola {{1}}, la cuota de auspicio de {{2}} ({{3}}) está vencida. Comunicate con el club para regularizarla. | contacto, periodo, nombre del plan |

Esperar a que cada template pase a estado **Approved**.

## Paso 3: Configurar variables en la API (Railway)

En el servicio de **futbol-platform-api**, agregar:

```env
WHATSAPP_GRAPH_TOKEN=EAANZC1...
WHATSAPP_PHONE_NUMBER_ID=1215227851677505
WHATSAPP_GRAPH_VERSION=v21.0
WHATSAPP_WEBHOOK_VERIFY_TOKEN=un-verify-token-secreto-propio
WHATSAPP_APP_SECRET=el-app-secret-de-meta
```

- `WHATSAPP_WEBHOOK_VERIFY_TOKEN`: valor propio (cualquier texto largo). Debe coincidir con el
  "Identificador de verificación" al configurar el webhook en Meta.
- El **webhook de WhatsApp** (solo para mensajes entrantes y estados de entrega, NO necesario para enviar)
  se configura en la app de Meta → WhatsApp → **Configuration → Webhook**:
  - **Callback URL**: `https://futbol-platform-production.up.railway.app/api/v1/webhooks/whatsapp`
  - **Verify token**: el mismo `WHATSAPP_WEBHOOK_VERIFY_TOKEN`
  - Suscribirse a los campos `messages` y `message_template_status_update`

## Paso 4: Verificar la conexión

```bash
curl -H "Authorization: Bearer TU_TOKEN_ADMIN" \
  http://localhost:3001/api/v1/whatsapp/status
```

Respuesta esperada:
```json
{ "data": { "connected": true } }
```

## Paso 5: Probar el envío

En modo desarrollo, Meta solo entrega mensajes a **números permitidos** (Test Recipients). Agregar el
celular propio en WhatsApp Manager → **Test recipients** y registrarlo como evaluador de la app.

### Envío de template individual:
```bash
curl -X POST \
  -H "Authorization: Bearer TU_TOKEN_ADMIN" \
  -H "Content-Type: application/json" \
  -d '{"phone": "5491123456789", "templateName": "cuota_disponible", "templateParams": ["Juan", "Agosto 2026", "Club Deportivo", "$1.000", "https://mpago.la/xxxx"]}' \
  http://localhost:3001/api/v1/whatsapp/send
```

### Envío a una suscripción (genera el template con los datos de la cuota):
```bash
curl -X POST \
  -H "Authorization: Bearer TU_TOKEN_ADMIN" \
  -H "Content-Type: application/json" \
  -d '{"type": "player"}' \
  http://localhost:3001/api/v1/whatsapp/send-subscription/SUBSCRIPTION_ID
```

### Envío masivo (encola en el outbox, se procesa con reintentos):
```bash
curl -X POST \
  -H "Authorization: Bearer TU_TOKEN_ADMIN" \
  -H "Content-Type: application/json" \
  -d '{"subscriptionIds": ["sub1", "sub2"]}' \
  http://localhost:3001/api/v1/whatsapp/bulk-send-player
```

## Costos

- **Cloud API**: con templates de categoría **Utility**, las primeras **1.000 conversaciones de
  servicio por mes son gratis** en Argentina. Para el volumen del club (~30-60 mensajes/mes) el costo es $0.
- Se cobra por **conversación** (ventana de 24h por contacto), no por mensaje. Solo se abre una
  conversación de servicio cuando un contacto responde.

## Troubleshooting

### "WhatsApp no configurado"
Verificar que `WHATSAPP_GRAPH_TOKEN` y `WHATSAPP_PHONE_NUMBER_ID` estén seteados en Railway.

### Error 131-048 / "template not found"
El template indicado no existe o no está **Approved**. Revisar el nombre exacto en WhatsApp Manager.

### Error 131-030 / "message failed to send because more than 24 hours have passed"
La ventana de 24h del contacto venció. Los templates Utility se pueden enviar aunque la ventana esté
cerrada, siempre que el template esté aprobado.

### Error 100 / "Session has expired"
El token de Graph expiró. Regenerar el token permanente en la app de Meta y actualizar la variable.

### Webhook de verificación falla
El GET de verificación responde `403`: el `hub.verify_token` no coincide con `WHATSAPP_WEBHOOK_VERIFY_TOKEN`.
El endpoint expuesto es `GET /api/v1/webhooks/whatsapp` (responde el `hub.challenge`).
