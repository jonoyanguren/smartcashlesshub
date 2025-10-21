# Packages & Rewards System

This document describes the new **Packages** and **Rewards** system that replaced the old "Offers" system.

## Overview

The system is split into two distinct models to better represent different business use cases:

- **Packages**: Pre-event purchasable products (users pay upfront)
- **Rewards**: Event-based automatic promotions (users earn rewards during the event)

## Packages (Pre-event)

### Purpose
Packages are products that users can purchase before the event starts. They typically include entry tickets, preloaded bracelets, and other items bundled together.

### Examples
- "Early Bird VIP Package" - Entry + 2 bracelets with 50€ each + 5€ fee
- "Standard Entry" - Basic entry ticket
- "VIP Bundle" - Entry + VIP access + preloaded bracelet

### Key Features
- **Pricing with discounts**: `originalPrice` (10€) vs `price` (8€) - shows savings
- **Stock management**: `maxQuantity`, `soldQuantity`
- **Sales period**: `saleStartDate`, `saleEndDate`
- **Purchase limits**: `maxPerUser`
- **Status**: DRAFT, ACTIVE, INACTIVE, EXPIRED, SOLD_OUT

### Database Schema

```prisma
model Package {
  id            String         @id @default(cuid())
  name          String
  description   String?
  status        PackageStatus  @default(DRAFT)
  price         Decimal        @db.Decimal(10, 2)
  originalPrice Decimal?       @db.Decimal(10, 2)
  maxQuantity   Int?
  soldQuantity  Int            @default(0)
  maxPerUser    Int?           @default(1)
  saleStartDate DateTime?
  saleEndDate   DateTime?
  eventId       String
  tenantId      String
  items         PackageItem[]
  purchases     PackagePurchase[]
}

model PackageItem {
  id             String          @id @default(cuid())
  name           String
  description    String?
  type           PackageItemType  // ENTRY, BRACELET, MERCHANDISE, SERVICE
  quantity       Int             @default(1)
  braceletAmount Decimal?        @db.Decimal(10, 2)
  packageId      String
}

model PackagePurchase {
  id                String         @id @default(cuid())
  status            PurchaseStatus @default(PENDING)
  amount            Decimal        @db.Decimal(10, 2)
  finalAmount       Decimal        @db.Decimal(10, 2)
  discountAmount    Decimal?       @db.Decimal(10, 2)
  paymentMethod     PaymentMethod?
  djangoBraceletIds String[]       @default([])
  activatedAt       DateTime?
  packageId         String
  userId            String
  eventId           String
  tenantId          String
}
```

### API Endpoints

```
GET    /api/v1/packages?eventId=xxx&status=ACTIVE
GET    /api/v1/packages/:id
POST   /api/v1/packages
PUT    /api/v1/packages/:id
DELETE /api/v1/packages/:id
```

## Rewards (Event-based)

### Purpose
Rewards are automatic promotions that trigger during the event when users meet certain conditions. They are **not purchased** - they are **earned**.

### Examples
- "Spend 150€ → Get 10€ free recharge"
- "Make 10 transactions → Get 5€ bonus"
- "Loyalty reward: Spend 200€ → Get 15% discount on next purchase"

### Key Features
- **Trigger conditions**:
  - `MINIMUM_SPEND`: User spends X euros
  - `TRANSACTION_COUNT`: User makes X transactions
  - `SPECIFIC_ITEMS`: User purchases specific items (future)

- **Reward types**:
  - `RECHARGE`: Add money to bracelet
  - `DISCOUNT_PERCENTAGE`: Percentage off next purchase (future)
  - `FREE_ITEM`: Specific free product (future)

- **Redemption limits**:
  - `maxRedemptionsPerUser`: How many times can one user claim?
  - `maxTotalRedemptions`: Global limit across all users

- **Status**: DRAFT, ACTIVE, INACTIVE, EXPIRED, DEPLETED

### Database Schema

```prisma
model Reward {
  id                    String            @id @default(cuid())
  name                  String
  description           String?
  status                RewardStatus      @default(DRAFT)
  triggerType           RewardTriggerType
  minimumSpend          Decimal?          @db.Decimal(10, 2)
  minimumTransactions   Int?
  rewardType            RewardType
  rewardAmount          Decimal?          @db.Decimal(10, 2)
  maxRedemptionsPerUser Int?              @default(1)
  maxTotalRedemptions   Int?
  currentRedemptions    Int               @default(0)
  activeFrom            DateTime?
  activeUntil           DateTime?
  eventId               String
  tenantId              String
  redemptions           RewardRedemption[]
}

model RewardRedemption {
  id                  String    @id @default(cuid())
  triggerAmount       Decimal?  @db.Decimal(10, 2)
  triggerTransactions Int?
  rewardAmount        Decimal   @db.Decimal(10, 2)
  djangoBraceletId    String?
  appliedAt           DateTime?
  rewardId            String
  userId              String
  eventId             String
  tenantId            String
  qualifiedAt         DateTime  @default(now())
}
```

### API Endpoints

```
GET    /api/v1/rewards?eventId=xxx&status=ACTIVE
GET    /api/v1/rewards/:id
POST   /api/v1/rewards
PUT    /api/v1/rewards/:id
DELETE /api/v1/rewards/:id
```

## Frontend UI

### Event Management Page
Navigate to an event → Click "Manage Event" button

The management page has two tabs:
1. **Pre-event (Packages)**: Manage purchasable packages
2. **Event (Rewards)**: Manage automatic rewards

### Package Creation Flow
1. Navigate to event → Manage Event → Pre-event tab
2. Click "Create Package"
3. Fill in:
   - Name, description
   - Price (and optional original price for showing discount)
   - Max quantity, max per user
   - Sales period dates
4. Optionally add items (currently in modal, can be expanded)
5. Save as DRAFT or ACTIVE

### Reward Creation Flow
1. Navigate to event → Manage Event → Event tab
2. Click "Create Reward"
3. Fill in:
   - Name, description
   - Trigger type (Minimum Spend / Transaction Count)
   - Trigger value (e.g., 150€ or 10 transactions)
   - Reward type (Recharge / Discount Percentage)
   - Reward amount (e.g., 10€ or 15%)
   - Max redemptions per user and total
4. Save as DRAFT or ACTIVE

## Key Differences: Package vs Reward

| Aspect | Package | Reward |
|--------|---------|--------|
| **Nature** | Product to sell | Promotion/reward |
| **Payment** | User pays upfront | No payment (it's a gift) |
| **Trigger** | User-initiated purchase | System-triggered (automatic) |
| **When** | Pre-event (sales period) | During event (consumption-based) |
| **Business Logic** | Inventory, stock, checkout flow | Threshold checking, auto-application |
| **Example** | "100€ = Entry + 2 bracelets" | "Spend 150€ → Get 10€ recharge" |

## Django Integration

### Packages
- When a package is purchased, bracelet IDs are stored in `PackagePurchase.djangoBraceletIds`
- Django should activate these bracelets when the user arrives at the event
- `activatedAt` timestamp records when bracelets were activated

### Rewards
- Rewards are checked automatically during the event based on user's spending
- When a reward is triggered, a `RewardRedemption` record is created
- Django applies the reward to the user's bracelet
- `appliedAt` timestamp records when the reward was added to the bracelet

## Migration from Offers

The old "Offers" system tried to combine both concepts into one model, which caused confusion:
- `BUNDLE` and `EARLY_BIRD` types → Now **Packages**
- `DISCOUNT_PERCENTAGE` type → Now **Rewards**

Benefits of separation:
- ✅ Clearer business logic
- ✅ Simpler validation rules
- ✅ Better UX (separate tabs for pre-event vs event)
- ✅ Easier to extend in the future
- ✅ More intuitive for users

## Error Codes

### Package Errors
- `PACKAGE_NOT_FOUND`
- `PACKAGE_EXPIRED`
- `PACKAGE_SOLD_OUT`
- `PACKAGE_INACTIVE`
- `PACKAGE_MAX_PER_USER_EXCEEDED`
- `PACKAGE_INVALID_PRICE`
- `PACKAGE_INVALID_QUANTITY`

### Reward Errors
- `REWARD_NOT_FOUND`
- `REWARD_EXPIRED`
- `REWARD_DEPLETED`
- `REWARD_INACTIVE`
- `REWARD_MAX_REDEMPTIONS_EXCEEDED`
- `REWARD_USER_NOT_QUALIFIED`
- `REWARD_INVALID_AMOUNT`

## Future Enhancements

### Packages
- Add package items management in the UI (currently simplified in modal)
- Package templates for common bundles
- Bulk pricing (buy 5, get 6th free)
- Early bird automatic price adjustments

### Rewards
- More trigger types (e.g., time-based, first purchase bonus)
- More reward types (free items, upgrades)
- Tiered rewards (spend 100€ → 5€, spend 200€ → 15€)
- Automatic email notifications when rewards are earned
- Gamification elements (progress bars, achievements)

## Testing

See TODO.md for testing checklist and verification steps.