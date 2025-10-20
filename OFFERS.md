# Offers & Packages System

> **Status:** In Development
> **Version:** 1.0.0
> **Last Updated:** 2025-01-20

## 📋 Table of Contents

1. [Overview](#overview)
2. [Business Model](#business-model)
3. [Architecture](#architecture)
4. [Database Schema](#database-schema)
5. [Offer Types](#offer-types)
6. [Complete Flow](#complete-flow)
7. [API Endpoints](#api-endpoints)
8. [Django Integration](#django-integration)
9. [Examples](#examples)
10. [Implementation Roadmap](#implementation-roadmap)

---

## 🎯 Overview

The **Offers & Packages System** allows tenants to create promotional offers for their events, enabling end-users to purchase entry tickets, bracelets with pre-loaded balance, and other items in advance through the mobile app.

### Key Features

- ✅ **Pre-sale bundles**: Entry + bracelets with initial balance
- ✅ **Early bird discounts**: Time-limited promotional pricing
- ✅ **Consumption discounts**: Percentage discounts on all purchases during the event
- ✅ **Stock management**: Limited quantity offers with automatic sold-out detection
- ✅ **User limits**: Maximum purchases per user to prevent abuse
- ✅ **Date restrictions**: Offers valid only within specific time windows

---

## 💼 Business Model

### Current System (Django)

- Physical bracelets are managed in Django
- Users can buy or receive bracelets (included with entry ticket)
- Smart Cashless charges €0.50-€1.00 per activated bracelet
- Bracelets can be recharged at staff devices
- Payments are processed through staff devices

### New System (Node.js + Django)

- **Node.js**: Manages offers, pre-sales, and user purchases
- **Django**: Handles bracelet activation and point-of-sale transactions
- **Integration**: When a purchase is completed, Node.js triggers Django to activate bracelets

---

## 🏗️ Architecture

### The Three Core Tables

#### 1. **OFFER** (The Product Template)

**What it is:** The offer that the tenant creates to sell
**Who creates it:** Tenant admin (e.g., Club Beso staff)
**How many:** Few (5-10 offers per event)

**Example:**
```json
{
  "id": "offer_123",
  "name": "Party Pack - Entry + 2 Bracelets",
  "type": "BUNDLE",
  "price": 100.00,
  "originalPrice": 200.00,
  "maxQuantity": 50,
  "maxPerUser": 2,
  "validUntil": "2025-01-10T23:59:59Z",
  "eventId": "event_xyz"
}
```

#### 2. **OFFER_ITEM** (The Components)

**What it is:** What's included inside that offer
**Purpose:** Detail the items the user receives
**Relationship:** One Offer has MANY OfferItems

**Example (for the offer above):**
```json
[
  {
    "id": "item_1",
    "offerId": "offer_123",
    "type": "ENTRY",
    "name": "General Entry",
    "quantity": 1
  },
  {
    "id": "item_2",
    "offerId": "offer_123",
    "type": "BRACELET",
    "name": "Bracelet with balance",
    "quantity": 2,
    "braceletInitialBalance": 50.00
  }
]
```

**What the user sees:**
- ✅ 1x General Entry
- ✅ 2x Bracelets with €50 each

#### 3. **OFFER_PURCHASE** (The Transaction Record)

**What it is:** The record that a USER purchased an OFFER
**Who creates it:** Automatically created when a user buys
**How many:** Many (thousands of purchases)

**Example:**
```json
{
  "id": "purchase_789",
  "offerId": "offer_123",
  "userId": "user_456",
  "quantity": 1,
  "totalPaid": 100.00,
  "status": "PAID",
  "djangoBraceletIds": ["BR001", "BR002"],
  "paidAt": "2025-01-05T14:30:00Z",
  "processedAt": "2025-01-05T14:31:00Z"
}
```

---

## 🗄️ Database Schema

### Enums

```prisma
enum OfferType {
  BUNDLE              // Complete package (entry + items)
  EARLY_BIRD          // Time-limited discount on the offer
  DISCOUNT_PERCENTAGE // Percentage discount on event consumptions
}

enum OfferStatus {
  DRAFT      // Being configured
  ACTIVE     // Available for purchase
  EXPIRED    // No longer available
  SOLD_OUT   // Stock exhausted
}

enum OfferItemType {
  ENTRY           // Event entry ticket
  BRACELET        // Bracelet (with or without balance)
  DRINK_VOUCHER   // Drink voucher
  FOOD_VOUCHER    // Food voucher
  MERCHANDISE     // Merchandise
  OTHER           // Other type
}

enum PurchaseStatus {
  PENDING    // Payment pending
  PAID       // Paid, pending processing
  PROCESSED  // Processed (bracelets activated in Django)
  CANCELLED  // Cancelled
  REFUNDED   // Refunded
}
```

### Models

```prisma
model Offer {
  id          String      @id @default(cuid())
  name        String
  description String?
  type        OfferType
  status      OfferStatus @default(DRAFT)

  // Pricing
  originalPrice      Decimal? @db.Decimal(10, 2) // Optional: to show discount
  price              Decimal  @db.Decimal(10, 2) // Final price user pays
  discountPercentage Decimal? @db.Decimal(5, 2)  // For consumption discounts

  // Restrictions
  maxQuantity Int?      // Maximum stock (null = unlimited)
  maxPerUser  Int?      @default(1) // Max per user
  validFrom   DateTime? // Available from
  validUntil  DateTime? // Available until

  // Relations
  eventId  String
  event    Event  @relation(fields: [eventId], references: [id], onDelete: Cascade)
  tenantId String
  tenant   Tenant @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  metadata Json? // Flexible data: badges, colors, images, etc.

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  items     OfferItem[]
  purchases OfferPurchase[]

  @@index([eventId])
  @@index([tenantId])
  @@index([status])
  @@index([validFrom, validUntil])
  @@map("offers")
}

model OfferItem {
  id          String        @id @default(cuid())
  type        OfferItemType
  name        String
  description String?
  quantity    Int           @default(1)

  // For bracelets: initial balance
  braceletInitialBalance Decimal? @db.Decimal(10, 2)

  offerId String
  offer   Offer  @relation(fields: [offerId], references: [id], onDelete: Cascade)

  metadata Json? // Flexible data: colors, icons, Django types, etc.

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([offerId])
  @@map("offer_items")
}

model OfferPurchase {
  id       String         @id @default(cuid())
  quantity Int            @default(1)
  status   PurchaseStatus @default(PENDING)

  // Price paid (saved for historical record)
  totalPaid Decimal @db.Decimal(10, 2)

  // Relations
  offerId String
  offer   Offer  @relation(fields: [offerId], references: [id])
  userId  String
  user    User   @relation(fields: [userId], references: [id])
  eventId String
  event   Event  @relation(fields: [eventId], references: [id])
  tenantId String
  tenant   Tenant @relation(fields: [tenantId], references: [id])

  // Django integration
  djangoBraceletIds String[] @default([]) // Bracelet IDs created in Django

  // Payment reference (optional, for Stripe/PayPal integration)
  paymentReference String?

  metadata Json? // Flexible data: delivery method, notes, etc.

  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  paidAt      DateTime? // When payment was completed
  processedAt DateTime? // When processed (bracelets created in Django)

  @@index([offerId])
  @@index([userId])
  @@index([eventId])
  @@index([tenantId])
  @@index([status])
  @@index([paidAt])
  @@map("offer_purchases")
}
```

---

## 🎨 Offer Types

### 1. BUNDLE (Package Deal)

**Description:** Complete package with entry and items
**Discount applies to:** The bundle price
**When:** Always available (within validity dates)

**Example:**
```typescript
{
  name: "Party Pack - Entry + 2 Bracelets",
  type: BUNDLE,
  price: 100.00,
  originalPrice: 200.00, // Shows €100 savings
  items: [
    { type: ENTRY, quantity: 1 },
    { type: BRACELET, quantity: 2, braceletInitialBalance: 50.00 }
  ]
}
```

**User sees:**
- Total value: €200 (€100 entry + 2×€50 bracelets)
- **Pay only: €100**
- **Savings: €100**

---

### 2. EARLY_BIRD (Time-Limited Discount)

**Description:** Discount on the offer if purchased before a date
**Discount applies to:** The offer purchase price
**When:** Only until `validUntil` date

**Example:**
```typescript
{
  name: "Early Bird - 20% OFF",
  type: EARLY_BIRD,
  price: 80.00,
  originalPrice: 100.00,
  validUntil: "2025-01-10T23:59:59Z", // 7 days before event
  items: [
    { type: ENTRY, quantity: 1 },
    { type: BRACELET, quantity: 1, braceletInitialBalance: 30.00 }
  ]
}
```

**User sees:**
- Normal price: €100
- **Early Bird price: €80** (if bought before Jan 10)
- **Savings: €20**

---

### 3. DISCOUNT_PERCENTAGE (Consumption Discount)

**Description:** Percentage discount on all consumptions during the event
**Discount applies to:** Drinks, food, etc. purchased with the bracelet
**When:** Throughout the event duration

**Example:**
```typescript
{
  name: "VIP Pass - 15% OFF Everything",
  type: DISCOUNT_PERCENTAGE,
  price: 50.00,
  discountPercentage: 15.00, // 15% off all consumptions
  items: [
    { type: ENTRY, name: "VIP Entry", quantity: 1 }
  ]
}
```

**During the event (Django applies discount):**
- Drink costs €10 → Pays €8.50 (15% discount)
- Food costs €20 → Pays €17 (15% discount)

**Django integration:**
```json
// OfferPurchase metadata sent to Django
{
  "discountPercentage": 15.00,
  "applyToAllTransactions": true
}
```

---

## 🔄 Complete Flow

### Step 1: Tenant Creates Offer

**Actor:** Tenant admin (Club Beso)
**Where:** Dashboard → Events → Create Offer

```typescript
// Admin fills form:
{
  name: "Party Pack - Entry + 2 Bracelets",
  type: BUNDLE,
  price: 100.00,
  maxQuantity: 50,
  maxPerUser: 2,
  validUntil: "2025-01-15"
}

// Add items:
items: [
  { type: ENTRY, quantity: 1 },
  { type: BRACELET, quantity: 2, balance: 50.00 }
]
```

**Result:** Offer created and visible in mobile app

---

### Step 2: User Views & Purchases

**Actor:** End user (Juan)
**Where:** Mobile app → Events → Offers

```typescript
// User sees:
"Party Pack - Entry + 2 Bracelets"
Price: €100 (was €200) - Save €100!
- 1× General Entry
- 2× Bracelets with €50 each
[BUY NOW] button

// User clicks "Buy Now"
→ Payment gateway (Stripe/PayPal)
→ Payment successful

// System creates:
OfferPurchase {
  offerId: "offer_123",
  userId: "juan_456",
  totalPaid: 100.00,
  status: PAID,
  paidAt: "2025-01-05T14:30:00Z"
}
```

---

### Step 3: System Processes Purchase

**Actor:** Node.js backend
**Where:** Automatic webhook after payment

```typescript
// Node.js receives payment confirmation
// Calls Django API:
POST /api/bracelets/activate
{
  userId: "juan_456",
  eventId: "event_xyz",
  bracelets: [
    { initialBalance: 50.00 },
    { initialBalance: 50.00 }
  ]
}

// Django responds:
{
  braceletIds: ["BR001", "BR002"]
}

// Node.js updates purchase:
OfferPurchase {
  status: PROCESSED,
  djangoBraceletIds: ["BR001", "BR002"],
  processedAt: "2025-01-05T14:31:00Z"
}
```

**Email sent to user:**
```
Subject: Your Party Pack is ready!

Hi Juan,

Your purchase is confirmed:
- Order ID: purchase_789
- Event: New Year Party 2025
- Date: Jan 15, 2025

You'll receive:
✅ 1× General Entry
✅ 2× Bracelets (€50 each)

Your bracelets: BR001, BR002

Show this QR code at the entrance:
[QR CODE IMAGE]

See you at the party!
```

---

### Step 4: At The Event

**Actor:** Event staff + Juan
**Where:** Event entrance

```typescript
// Staff scans QR code
// Django checks:
{
  userId: "juan_456",
  eventId: "event_xyz",
  bracelets: ["BR001", "BR002"],
  status: "ACTIVE"
}

// Staff gives Juan:
- Entry wristband
- 2 physical bracelets (BR001, BR002)

// Juan can now:
- Buy drinks/food with bracelets
- Recharge bracelets at staff devices
```

---

## 📡 API Endpoints

### Offers Management (Tenant Admin)

```typescript
// List all offers for an event
GET /api/v1/events/:eventId/offers
Response: Offer[]

// Get single offer details
GET /api/v1/offers/:offerId
Response: Offer (with items)

// Create new offer
POST /api/v1/events/:eventId/offers
Body: {
  name: string,
  type: OfferType,
  price: number,
  originalPrice?: number,
  maxQuantity?: number,
  maxPerUser?: number,
  validUntil?: string,
  items: OfferItemInput[]
}
Response: Offer

// Update offer
PUT /api/v1/offers/:offerId
Body: Partial<Offer>
Response: Offer

// Delete offer
DELETE /api/v1/offers/:offerId
Response: { success: boolean }
```

### Offer Purchases (End Users)

```typescript
// List available offers for event (public)
GET /api/v1/events/:eventId/offers/available
Query: {
  userId?: string // To check maxPerUser limits
}
Response: Offer[] (only ACTIVE and valid)

// Purchase an offer
POST /api/v1/offers/:offerId/purchase
Body: {
  quantity: number,
  paymentMethod: string
}
Response: OfferPurchase

// Get user's purchases
GET /api/v1/users/:userId/purchases
Query: {
  eventId?: string,
  status?: PurchaseStatus
}
Response: OfferPurchase[]

// Get purchase details
GET /api/v1/purchases/:purchaseId
Response: OfferPurchase (with offer and items)
```

---

## 🔗 Django Integration

### Bracelet Activation Flow

**Trigger:** When OfferPurchase status changes to PAID

```typescript
// Node.js calls Django API
POST https://django-api.smartcashless.com/api/v1/bracelets/bulk-activate
Headers: {
  Authorization: "Bearer {django_api_key}",
  X-Tenant-ID: "{tenantId}"
}
Body: {
  userId: "juan_456",
  eventId: "event_xyz",
  purchaseId: "purchase_789",
  bracelets: [
    {
      initialBalance: 50.00,
      currency: "EUR",
      metadata: {
        source: "offer_purchase",
        offerId: "offer_123"
      }
    },
    {
      initialBalance: 50.00,
      currency: "EUR",
      metadata: {
        source: "offer_purchase",
        offerId: "offer_123"
      }
    }
  ]
}

// Django Response:
{
  success: true,
  bracelets: [
    {
      id: "BR001",
      balance: 50.00,
      qrCode: "data:image/png;base64,..."
    },
    {
      id: "BR002",
      balance: 50.00,
      qrCode: "data:image/png;base64,..."
    }
  ]
}
```

### Discount Application (DISCOUNT_PERCENTAGE type)

**Trigger:** When user pays with bracelet at event

```typescript
// Django checks if user has active discount
GET https://django-api.smartcashless.com/api/v1/users/{userId}/active-discounts
Query: { eventId: "event_xyz" }

// Response:
{
  discounts: [
    {
      type: "PERCENTAGE",
      value: 15.00,
      source: "offer_purchase",
      purchaseId: "purchase_789"
    }
  ]
}

// Django applies discount:
// Original: €10.00
// With 15% discount: €8.50
```

---

## 📚 Examples

### Example 1: Simple Bundle

**Scenario:** Club wants to sell entry + 1 bracelet

```typescript
Offer {
  name: "Entry + Bracelet",
  type: BUNDLE,
  price: 60.00,
  originalPrice: 80.00,
  items: [
    { type: ENTRY, quantity: 1 },
    { type: BRACELET, quantity: 1, braceletInitialBalance: 40.00 }
  ]
}
```

**User pays:** €60
**User receives:** Entry + 1 bracelet with €40
**Value:** €80 (€40 entry + €40 bracelet)
**Savings:** €20

---

### Example 2: Early Bird with Multiple Items

**Scenario:** Early bird offer with drinks included

```typescript
Offer {
  name: "Early Bird Special",
  type: EARLY_BIRD,
  price: 50.00,
  originalPrice: 70.00,
  validUntil: "2025-01-10T23:59:59Z",
  maxQuantity: 100,
  maxPerUser: 1,
  items: [
    { type: ENTRY, quantity: 1 },
    { type: BRACELET, quantity: 1, braceletInitialBalance: 30.00 },
    { type: DRINK_VOUCHER, quantity: 2, metadata: { drinkType: "beer" } }
  ]
}
```

**User pays:** €50 (only before Jan 10)
**User receives:**
- Entry
- 1 bracelet with €30
- 2 free beer vouchers

---

### Example 3: VIP with Consumption Discount

**Scenario:** VIP entry with 20% discount on everything

```typescript
Offer {
  name: "VIP Experience",
  type: DISCOUNT_PERCENTAGE,
  price: 100.00,
  discountPercentage: 20.00,
  items: [
    { type: ENTRY, name: "VIP Entry", quantity: 1 },
    { type: BRACELET, quantity: 1, braceletInitialBalance: 50.00 }
  ]
}
```

**User pays:** €100
**User receives:**
- VIP entry
- 1 bracelet with €50
- **20% discount on ALL purchases during event**

**At the event:**
- Cocktail €15 → Pays €12
- Food €25 → Pays €20
- Total savings depend on spending

---

### Example 4: Combined Early Bird + Discount

**Scenario:** Best of both worlds

```typescript
Offer {
  name: "SUPER VIP Early Bird",
  type: EARLY_BIRD,
  price: 70.00,
  originalPrice: 100.00,
  discountPercentage: 15.00, // BONUS: Also get 15% off consumptions!
  validUntil: "2025-01-05T23:59:59Z",
  maxQuantity: 25,
  items: [
    { type: ENTRY, name: "VIP Entry", quantity: 1 },
    { type: BRACELET, quantity: 2, braceletInitialBalance: 40.00 }
  ]
}
```

**User pays:** €70 (before Jan 5)
**User saves:** €30 on purchase + 15% on all consumptions
**Limited:** Only 25 available

---

## 🗺️ Implementation Roadmap

### Phase 1: Database & Backend (Week 1)
- [x] Create OFFERS.md documentation
- [ ] Add Offer, OfferItem, OfferPurchase models to Prisma schema
- [ ] Create and run database migration
- [ ] Implement CRUD endpoints for Offers
- [ ] Implement purchase endpoints
- [ ] Add validation logic (stock, dates, user limits)

### Phase 2: Dashboard UI (Week 2)
- [ ] Create Offers page in tenant dashboard
- [ ] Create "New Offer" form with items builder
- [ ] Add offer list with status indicators
- [ ] Implement edit/delete functionality
- [ ] Add stock monitoring and sold-out badges

### Phase 3: Mobile App UI (Week 3)
- [ ] Design offers listing page
- [ ] Create offer detail view
- [ ] Implement purchase flow
- [ ] Add payment integration (Stripe/PayPal)
- [ ] Show user's purchased offers

### Phase 4: Django Integration (Week 4)
- [ ] Design Django API endpoints for bracelet activation
- [ ] Implement automatic bracelet creation on purchase
- [ ] Add discount application logic in Django
- [ ] Create QR code generation
- [ ] Test end-to-end flow

### Phase 5: Testing & Launch (Week 5)
- [ ] Unit tests for all endpoints
- [ ] Integration tests for purchase flow
- [ ] Test with real Django instance
- [ ] Performance testing (1000+ concurrent purchases)
- [ ] Production deployment

---

## 📝 Notes

- All prices are in EUR (configurable per tenant in the future)
- Time zones are handled in UTC, displayed in user's local time
- QR codes are generated by Django and returned to Node.js
- Payment processing is handled by third-party (Stripe/PayPal)
- Email notifications are sent via Brevo (formerly Sendinblue)

---

## 🚀 Future Enhancements

- [ ] Group discounts (buy for 5+ people)
- [ ] Referral bonuses (invite friends, get discount)
- [ ] Tiered offers (Bronze/Silver/Gold packages)
- [ ] Gift cards and vouchers
- [ ] Subscription-based offers (monthly events)
- [ ] Loyalty points integration
- [ ] Multi-currency support
- [ ] Crypto payment integration

---

**Last Updated:** January 20, 2025
**Authors:** Smart Cashless Team
**Status:** 🚧 In Development
