# Django Payment Integration

Este documento describe cómo integrar el sistema de pagos de Django con el backend de Node.js (Smart Cashless Hub).

## Descripción General

El backend de Node.js almacena un "mirror" de los datos de pagos procesados en Django. Cuando Django procesa un pago, debe enviar los datos a través de webhooks a los endpoints de este backend para mantener sincronizados los datos de estadísticas.

## Endpoints Disponibles

### Base URL
```
http://localhost:3001/api/v1/payments
```

En producción, usar el dominio correspondiente del backend de Node.js.

---

## 1. Crear Pago

**Endpoint:** `POST /api/v1/payments`

**Descripción:** Crea un nuevo registro de pago en el backend de Node.js. Django debe llamar a este endpoint cuando se procese un pago nuevo.

### Headers
```
Content-Type: application/json
```

### Request Body
```json
{
  "djangoPaymentId": "pay_abc123",  // ID del pago en Django (único)
  "amount": 25.50,                   // Monto del pago (Decimal)
  "currency": "EUR",                 // Código de moneda ISO (opcional, default: EUR)
  "paymentMethod": "BRACELET",       // BRACELET | CARD | CASH | WALLET | TRANSFER | OTHER
  "status": "COMPLETED",             // PENDING | COMPLETED | REFUNDED
  "paidAt": "2025-10-19T14:30:00Z",  // ISO 8601 timestamp (null si PENDING)
  "eventId": "evt_xyz789",           // ID del evento en Node.js
  "userId": "usr_abc456",            // ID del usuario en Node.js
  "tenantId": "tnt_def123",          // ID del tenant en Node.js
  "metadata": {                      // JSON opcional con información adicional
    "description": "Entry ticket + 2 drinks",
    "items": [
      {
        "name": "Entry",
        "price": 10,
        "quantity": 1
      },
      {
        "name": "Drink",
        "price": 7.75,
        "quantity": 2
      }
    ],
    "braceletId": "BR123456"
  }
}
```

### Response (201 Created)
```json
{
  "success": true,
  "data": {
    "id": "cuid_generated_id",
    "djangoPaymentId": "pay_abc123",
    "amount": 25.50,
    "currency": "EUR",
    "paymentMethod": "BRACELET",
    "status": "COMPLETED",
    "paidAt": "2025-10-19T14:30:00.000Z",
    "eventId": "evt_xyz789",
    "userId": "usr_abc456",
    "tenantId": "tnt_def123",
    "metadata": { ... },
    "createdAt": "2025-10-19T14:30:05.000Z",
    "updatedAt": "2025-10-19T14:30:05.000Z"
  }
}
```

### Errores Comunes
- `400 Bad Request` - Validación fallida (amount inválido, campos requeridos faltantes)
- `404 Not Found` - Event, User o Tenant no encontrado
- `500 Internal Server Error` - Error del servidor

---

## 2. Actualizar Estado de Pago

**Endpoint:** `PATCH /api/v1/payments/:djangoPaymentId`

**Descripción:** Actualiza el estado de un pago existente. Útil cuando un pago cambia de PENDING a COMPLETED o se hace un REFUNDED.

### URL Parameters
- `djangoPaymentId`: El ID del pago en Django (string)

### Headers
```
Content-Type: application/json
```

### Request Body
```json
{
  "status": "COMPLETED",             // Nuevo estado (requerido)
  "paidAt": "2025-10-19T14:35:00Z",  // Timestamp de completado (opcional)
  "metadata": {                      // Metadata actualizada (opcional)
    "refundReason": "Customer request"
  }
}
```

### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "id": "cuid_generated_id",
    "djangoPaymentId": "pay_abc123",
    "status": "COMPLETED",
    "paidAt": "2025-10-19T14:35:00.000Z",
    ...
  }
}
```

### Errores Comunes
- `400 Bad Request` - Status no proporcionado o inválido
- `404 Not Found` - Payment no encontrado con ese djangoPaymentId
- `500 Internal Server Error` - Error del servidor

---

## 3. Obtener Pagos de un Evento (Dashboard)

**Endpoint:** `GET /api/v1/payments/events/:eventId`

**Descripción:** Obtiene todos los pagos de un evento específico. Este endpoint es usado por el frontend del dashboard y requiere autenticación.

**Nota:** Este endpoint NO debe ser llamado por Django. Es solo para consulta desde el dashboard.

### Headers
```
Authorization: Bearer <JWT_TOKEN>
```

---

## 4. Obtener Estadísticas de Pagos (Dashboard)

**Endpoint:** `GET /api/v1/payments/events/:eventId/stats`

**Descripción:** Obtiene estadísticas agregadas de pagos para un evento. Usado por el frontend del dashboard.

**Nota:** Este endpoint NO debe ser llamado por Django. Es solo para el dashboard.

### Response
```json
{
  "success": true,
  "data": {
    "totalRevenue": 1234.50,
    "totalTransactions": 48,
    "avgTransaction": 25.72,
    "paymentMethodStats": {
      "BRACELET": 35,
      "CARD": 8,
      "CASH": 4,
      "WALLET": 1
    },
    "revenueByHour": {
      "22": 250.00,
      "23": 450.50,
      "0": 534.00
    }
  }
}
```

---

## Flujo de Integración Recomendado

### 1. Pago Iniciado
Cuando un usuario inicia un pago en Django con estado PENDING:

```python
# Django code
import requests

payment_data = {
    "djangoPaymentId": f"pay_{django_payment.id}",
    "amount": float(payment.amount),
    "currency": "EUR",
    "paymentMethod": map_payment_method(payment.method),  # Tu función de mapeo
    "status": "PENDING",
    "paidAt": None,
    "eventId": event.node_id,  # ID del evento en Node.js
    "userId": user.node_id,    # ID del usuario en Node.js
    "tenantId": tenant.node_id,  # ID del tenant en Node.js
    "metadata": {
        "description": payment.description,
        "braceletId": payment.bracelet_id
    }
}

response = requests.post(
    "http://node-backend:3001/api/v1/payments",
    json=payment_data,
    headers={"Content-Type": "application/json"}
)

if response.status_code == 201:
    print("Payment created in Node.js backend")
else:
    print(f"Error: {response.text}")
```

### 2. Pago Completado
Cuando el pago se procesa exitosamente:

```python
# Django code
update_data = {
    "status": "COMPLETED",
    "paidAt": payment.paid_at.isoformat(),
    "metadata": {
        "transaction_id": payment.transaction_id,
        "confirmation_code": payment.confirmation
    }
}

response = requests.patch(
    f"http://node-backend:3001/api/v1/payments/pay_{payment.id}",
    json=update_data,
    headers={"Content-Type": "application/json"}
)
```

### 3. Pago Reembolsado
Si se hace un reembolso:

```python
# Django code
update_data = {
    "status": "REFUNDED",
    "metadata": {
        "refund_reason": refund.reason,
        "refunded_at": refund.created_at.isoformat()
    }
}

response = requests.patch(
    f"http://node-backend:3001/api/v1/payments/pay_{payment.id}",
    json=update_data
)
```

---

## Mapeo de Métodos de Pago

### Django → Node.js
```python
def map_payment_method(django_method):
    """
    Mapea los métodos de pago de Django a los de Node.js
    """
    mapping = {
        "bracelet": "BRACELET",
        "credit_card": "CARD",
        "debit_card": "CARD",
        "cash": "CASH",
        "apple_pay": "WALLET",
        "google_pay": "WALLET",
        "bank_transfer": "TRANSFER",
    }
    return mapping.get(django_method.lower(), "OTHER")
```

---

## IDs Sincronizados

Para que la integración funcione, necesitas mantener sincronizados los IDs entre Django y Node.js:

### En Django
Cuando crees usuarios, eventos o tenants que serán visibles en Node.js, debes:

1. **Crear primero en Node.js** (vía API)
2. **Guardar el ID de Node.js** en Django
3. **Usar ese ID** cuando hagas pagos

Ejemplo:
```python
# Modelo en Django
class Event(models.Model):
    name = models.CharField(max_length=255)
    node_event_id = models.CharField(max_length=50)  # ID del evento en Node.js
    # ... otros campos
```

### Campos Requeridos para Sincronización
- `eventId`: ID del evento en Node.js
- `userId`: ID del usuario en Node.js
- `tenantId`: ID del tenant en Node.js

---

## Seguridad (TODO)

**IMPORTANTE:** Actualmente los endpoints de webhook (`POST /payments` y `PATCH /payments/:id`) NO tienen autenticación.

### Próxima implementación recomendada:

1. **API Key**: Añadir header `X-API-Key` para validar peticiones de Django
2. **Webhook Signatures**: Firmar las peticiones con HMAC
3. **IP Whitelist**: Solo aceptar peticiones desde IPs conocidas de Django

```python
# Futuro header requerido
headers = {
    "Content-Type": "application/json",
    "X-API-Key": "tu-api-key-secreta"
}
```

---

## Testing

### Crear un pago de prueba
```bash
curl -X POST http://localhost:3001/api/v1/payments \
  -H "Content-Type: application/json" \
  -d '{
    "djangoPaymentId": "pay_test_123",
    "amount": 25.50,
    "currency": "EUR",
    "paymentMethod": "BRACELET",
    "status": "COMPLETED",
    "paidAt": "2025-10-19T14:30:00Z",
    "eventId": "YOUR_EVENT_ID",
    "userId": "YOUR_USER_ID",
    "tenantId": "YOUR_TENANT_ID",
    "metadata": {
      "test": true
    }
  }'
```

### Actualizar estado de pago
```bash
curl -X PATCH http://localhost:3001/api/v1/payments/pay_test_123 \
  -H "Content-Type": "application/json" \
  -d '{
    "status": "REFUNDED",
    "metadata": {
      "refund_reason": "Test refund"
    }
  }'
```

---

## Datos de Seed

El backend ya tiene datos de prueba generados con el script `prisma/seed.ts`:

- **100 usuarios END_USER**
- **6 eventos** con diferentes estados
- **550 pagos** distribuidos entre eventos completados y el evento activo
- Distribución realista de métodos de pago (70% pulsera, 15% tarjeta, 10% efectivo, 5% wallet)

Para regenerar los datos de prueba:
```bash
cd backend
npx prisma db seed
```

---

## Contacto y Soporte

Para dudas sobre la integración, contactar con el equipo de desarrollo de Smart Cashless Hub.