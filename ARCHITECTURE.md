# Smart Cashless Hub - System Architecture

## Overview

Smart Cashless Hub is a marketing, analytics, and loyalty platform built as a **value-added layer** on top of an existing cashless payment system (Django + Dojo). The project uses an **API Gateway architecture** where Node.js acts as middleware between client applications and the Django backend.

## Development Philosophy

### Principle: Simplicity First

**MVP without unnecessary complexity:**
- TypeScript for type safety (no additional validation libraries)
- Libraries only when they provide real and clear value
- Don't add technology "just in case" or for theoretical "best practices"
- Scale with libraries only when truly necessary

**What we DO use:**
- ✅ Express - Core framework
- ✅ TypeScript - Native type safety
- ✅ Prisma + PostgreSQL - Type-safe ORM with migrations (justifies complexity for complex data model)
- ✅ Helmet - Security with 1 line
- ✅ CORS - Necessary and simple
- ✅ Morgan - Professional logging
- ✅ React, Vite, Expo - Essential tooling

**What we DON'T use (for now):**
- ❌ Zod - TypeScript already provides the types we need
- ❌ Complex validation libraries
- ❌ Technology that adds complexity without clear value in MVP

**Exception: Prisma ORM**
We use Prisma despite the "simplicity first" principle because:
- Complex data model (campaigns, loyalty, multi-tenant) with many relationships
- Type safety from database to API with auto-generated types
- Schema migrations prevent database mistakes
- Multi-tenant queries are cleaner and safer
- Developer productivity gain justifies the added complexity

### CRITICAL RULE: English Only

**ALL code, comments, and documentation MUST be in English:**
- ✅ Variable names in English
- ✅ Function names in English
- ✅ Comments in English
- ✅ Documentation in English
- ✅ Git commit messages in English
- ✅ Interface/Type names in English

**No exceptions. This applies to:**
- Backend code
- Frontend code
- Mobile app code
- Documentation
- Comments
- Console logs
- Error messages

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      CLIENT LAYER                            │
├──────────────────────────┬──────────────────────────────────┤
│   Web Dashboard          │   Mobile App                     │
│   React + Vite           │   React Native + Expo            │
│   Port: 5173             │   Expo Go / Standalone           │
└──────────────┬───────────┴──────────────┬───────────────────┘
               │                          │
               └──────────┬───────────────┘
                          │ HTTP/REST
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                   API GATEWAY LAYER                          │
│   Node.js + Express + TypeScript                            │
│   Port: 3001                                                 │
│   - JWT Authentication                                       │
│   - TypeScript Validation                                    │
│   - Response Transformation                                  │
│   - Rate Limiting (future)                                   │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTP/REST
                           ▼
┌─────────────────────────────────────────────────────────────┐
│              DJANGO BACKEND (Existing System)                │
│   Django + Django REST Framework                             │
│   Port: 8000                                                 │
│   - Payment processing                                       │
│   - User authentication                                      │
│   - Transactions                                             │
│   - Main database                                            │
└─────────────────────────────────────────────────────────────┘
```

## Key Technical Decisions

### 1. Why Node.js + Express as Gateway?

**Advantages:**
- **Separation of concerns**: Django focuses on payments and core business, Node.js on marketing/analytics
- **Performance**: Node.js handles concurrent connections better for dashboards and real-time notifications
- **Flexibility**: Allows adding features without modifying the critical payment system
- **Modern tech stack**: TypeScript, better integration with React/React Native
- **Scalability**: Easy to scale horizontally if analytics traffic grows

**Gateway Responsibilities:**
- Proxy requests to Django backend
- JWT authentication and authorization
- Data validation with TypeScript interfaces
- Data transformation for clients
- Marketing/campaigns/notifications specific logic

### 2. Monorepo

**Project Structure:**
```
smart-cashless/
├── backend/             # API Gateway (Node.js)
├── frontend/            # Web Dashboard (React)
├── app/                 # Mobile App (React Native)
├── ARCHITECTURE.md      # This document
├── CONVENTIONS.md       # Code conventions
├── README.md            # General documentation
├── .claude/             # Context for Claude Code
└── .cursorrules         # Rules for Cursor
```

**Advantages:**
- Synchronized versioning between frontend/backend/app
- Share TypeScript types between modules
- Easier refactoring
- Single command to clone everything

**Note:** Each module maintains its own `package.json` and `node_modules`

### 3. TypeScript Across the Stack

**Configuration: TypeScript strict mode in all modules**

```json
{
  "strict": true,
  "noUnusedLocals": true,
  "noUnusedParameters": true
}
```

**Benefits:**
- End-to-end type safety
- Better DX with autocomplete
- Fewer runtime bugs
- Implicit documentation in code
- No need for additional validation libraries

## Architecture by Module

### Backend (API Gateway)

**Tech Stack:**
- Node.js 20.x + Express 4.18
- TypeScript 5.3
- Helmet 7.1 (security)
- Morgan 1.10 (logging)
- CORS (middleware)

**Structure:**
```
backend/
├── src/
│   └── index.ts          # Server entry point
├── dist/                 # Compiled TypeScript (gitignored)
├── .env.example          # Environment variables template
├── tsconfig.json         # TypeScript configuration
└── package.json
```

**Configuration (environment variables):**
```bash
NODE_ENV=development|production
PORT=3001
DJANGO_API_URL=http://localhost:8000/api
JWT_SECRET=your-secret-key
CORS_ORIGIN=http://localhost:5173
```

**Current Status:**
- ✅ Express server configured
- ✅ Middleware stack (Helmet, CORS, Morgan, JSON)
- ✅ Health check endpoint: `GET /health`
- ✅ API version endpoint: `GET /api/v1`
- ⏳ Business endpoints (pending)
- ⏳ Django connection (pending)
- ⏳ JWT authentication (pending)

**Recommended Development Pattern:**
```typescript
// Endpoint structure with TypeScript types
// src/routes/campaigns.ts
import { Router, Request, Response } from 'express';

const router = Router();

// Types defined with TypeScript
interface Campaign {
  name: string;
  startDate: string;
  endDate: string;
  status: 'active' | 'inactive';
}

interface CreateCampaignRequest {
  name: string;
  startDate: string;
  endDate: string;
}

router.post('/campaigns', async (req: Request, res: Response) => {
  // Simple validation with TypeScript
  const data = req.body as CreateCampaignRequest;

  if (!data.name || !data.startDate || !data.endDate) {
    return res.status(400).json({
      error: 'Missing required fields'
    });
  }

  // Business logic
  res.json({ success: true, data });
});

export default router;
```

**Proposed Folder Structure (future):**
```
backend/src/
├── index.ts              # Entry point
├── routes/               # Endpoint definitions
│   ├── campaigns.ts
│   ├── loyalty.ts
│   └── notifications.ts
├── types/                # TypeScript types/interfaces
│   ├── campaign.ts
│   └── user.ts
├── services/             # Business logic
│   └── djangoClient.ts   # Django API client
├── middleware/           # Custom middleware
│   └── auth.ts
└── utils/                # Utilities
    └── validators.ts     # Simple validations
```

### Frontend (Web Dashboard)

**Tech Stack:**
- React 19.1 (latest stable)
- Vite 7.1
- TypeScript 5.9

**Structure:**
```
frontend/
├── src/
│   ├── main.tsx          # Entry point
│   ├── App.tsx           # Root component
│   └── App.css
├── public/               # Static assets
├── dist/                 # Production build (gitignored)
├── index.html            # HTML template
├── tsconfig.json
└── vite.config.ts
```

**Current Status:**
- ✅ Vite + React boilerplate
- ✅ TypeScript configured (strict mode)
- ✅ ESLint with React Hooks rules
- ⏳ Dashboard UI/UX (pending)
- ⏳ Backend integration (pending)
- ⏳ Component library (only when necessary)

**Proposed Folder Structure (future):**
```
src/
├── components/       # Reusable components
├── pages/           # Pages/views
├── hooks/           # Custom hooks
├── services/        # API calls
├── types/           # TypeScript types/interfaces
└── utils/           # Utilities
```

### Mobile App (React Native + Expo)

**Tech Stack:**
- React Native 0.81
- Expo 54
- TypeScript 5.9
- New Architecture enabled (Fabric)

**Structure:**
```
app/
├── App.tsx              # Main component
├── index.ts             # Expo entry point
├── app.json             # Expo configuration
├── assets/              # Icons, splash screens
└── package.json
```

**Expo Configuration:**
- iOS + Android + Web support
- Adaptive icons for Android
- Edge-to-edge display
- Tablet support on iOS

**Current Status:**
- ✅ Expo project initialized
- ✅ New Architecture enabled
- ✅ Multi-platform configuration
- ⏳ App UI/UX (pending)
- ⏳ Navigation (React Navigation when necessary)
- ⏳ Backend integration (pending)

## Django Backend Integration

### Data Flow Example: User Login

```
1. User enters credentials in Web Dashboard
2. Frontend → POST /api/auth/login (Node.js Gateway)
3. Gateway validates data with TypeScript types
4. Gateway → POST /api/auth/login (Django Backend)
5. Django verifies credentials and generates JWT
6. Django → responds with token to Gateway
7. Gateway transforms response if necessary
8. Gateway → responds with token to Frontend
9. Frontend stores token (localStorage/sessionStorage)
10. Subsequent requests include token in Authorization header
```

### Existing Django Endpoints (to verify)

**Assumed from Django system:**
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - Logout
- `GET /api/users/me` - Current user data
- `GET /api/transactions` - Transaction history
- `GET /api/balance` - Current user balance

**Action:** Verify exactly which endpoints the Django backend has.

## Main Features (Roadmap)

### 1. Marketing Campaigns

**Entities:**
```typescript
interface Campaign {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  type: 'discount' | 'promotion' | 'loyalty';
  status: 'active' | 'inactive' | 'scheduled';
  rules: CampaignRule[];
}

interface CampaignRule {
  condition: string;
  discount: number;
  maxUses?: number;
}
```

### 2. Loyalty Programs

**Entities:**
```typescript
interface LoyaltyProgram {
  id: string;
  name: string;
  pointsPerEuro: number;
}

interface UserPoints {
  userId: string;
  points: number;
  lastUpdated: string;
}

interface Reward {
  id: string;
  name: string;
  pointsCost: number;
  description: string;
}
```

### 3. Multi-Channel Notifications

**Channels:**
- Push notifications (Expo Push for mobile)
- Email (when necessary: SendGrid, AWS SES)
- SMS (when necessary: Twilio, AWS SNS)

**Entities:**
```typescript
interface Notification {
  id: string;
  userId: string;
  channel: 'push' | 'email' | 'sms';
  message: string;
  status: 'sent' | 'pending' | 'failed';
  sentAt?: string;
}
```

### 4. Analytics and Dashboards

**Metrics:**
- Transactions per day/week/month
- Campaign conversion rates
- Active users
- Notification engagement
- Points earned/redeemed

**Visualization:**
- Charts (library only when necessary)
- Tables with filters
- Report export (CSV when necessary)

### 5. Multi-Tenant

**Separation by tenant (event/client):**
```typescript
interface Tenant {
  id: string;
  name: string;
  slug: string;
}

// JWT includes tenantId
interface JWTPayload {
  userId: string;
  email: string;
  tenantId: string;
  roles: string[];
}
```

## Database

### Choice: PostgreSQL + Prisma ORM

**Database: PostgreSQL**
- Relational data model fits campaigns, loyalty, users, rewards
- ACID compliance critical for loyalty points (no data loss/duplication)
- Multi-tenant support with row-level security
- JSON support for flexible fields (campaign rules, metadata)
- Analytics-friendly (aggregations, window functions)
- Mature and battle-tested

**ORM: Prisma**
- Type-safe database access with auto-generated TypeScript types
- Schema migrations with version control
- Prevents SQL injection automatically
- Clean multi-tenant query patterns
- Excellent PostgreSQL support
- Great developer experience

**Database Strategy:**
- Own PostgreSQL database for Smart Cashless Hub
- Reference Django users by ID (don't duplicate user data)
- Sync user data from Django when needed via API
- Keep payment/transaction data in Django
- Marketing/loyalty/analytics data in Node.js database

## Security

### Authentication and Authorization

**JWT (JSON Web Tokens):**
```typescript
interface User {
  userId: string;
  email: string;
  tenantId: string;
  roles: string[];
}

// Simple authentication middleware
const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    // Verify JWT
    const decoded = verifyJWT(token) as User;
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};
```

### Security Headers (Helmet)

Already configured in Express with a single line.

### CORS

Configured to allow only the frontend:
```typescript
app.use(cors({
  origin: process.env.CORS_ORIGIN,
  credentials: true
}));
```

### Data Validation

Validation with TypeScript types and simple checks:
```typescript
function validateCampaign(data: any): data is Campaign {
  return (
    typeof data.name === 'string' &&
    typeof data.startDate === 'string' &&
    typeof data.endDate === 'string'
  );
}
```

## Deployment

### Local Development

```bash
# Terminal 1: Django backend (existing project)
cd ../django-backend
python manage.py runserver

# Terminal 2: Node.js Gateway
cd backend
npm run dev

# Terminal 3: Web Dashboard
cd frontend
npm run dev

# Terminal 4: Mobile App
cd app
npm start
```

### Production (When necessary)

**Node.js Backend:**
- Railway, Render, Fly.io (simple and fast)
- Build: `npm run build` → runs `dist/index.js`

**Frontend:**
- Vercel, Netlify (automatic deploy)
- Build: `npm run build` → generates `/dist`

**Mobile App:**
- Expo EAS Build when ready
- App Store + Google Play

## Testing

**Philosophy:** Add tests when we have critical code to test, not before.

**Future (when necessary):**
- Jest/Vitest for unit tests
- E2E only for critical flows

## Next Steps

### Immediate
1. ✅ Project documentation
2. Define API endpoints needed for MVP
3. Connect Node.js Gateway with Django backend
4. Implement basic JWT authentication
5. Design basic dashboard UI

### Short Term
1. Basic CRUD for campaigns
2. Simple loyalty points system
3. Dashboard with basic data

### Medium Term
1. Basic push notifications
2. Simple reports
3. Multi-tenant support

---

**Last updated:** 2025-10-18
**Version:** 1.0
