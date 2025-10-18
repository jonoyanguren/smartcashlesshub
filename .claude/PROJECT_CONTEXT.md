# Smart Cashless Hub - Project Context for Claude Code

## What is this project

Smart Cashless Hub is a marketing, analytics, and loyalty platform built as a **value-added layer** on top of an existing cashless payment system (Django + Dojo).

**Important:** This is NOT the payment system. The payment system already exists in Django. This is the marketing, campaigns, loyalty, and analytics layer on top of it.

## Monorepo Structure

```
smart-cashless/
├── backend/      # Node.js + Express API Gateway (Port 3001)
├── frontend/     # React + Vite Web Dashboard (Port 5173)
└── app/          # React Native + Expo Mobile App
```

Each module has its own `package.json` and `node_modules`.

## Development Philosophy - VERY IMPORTANT

### Golden Rule: Simplicity First

**DO NOT add unnecessary libraries. This is an MVP.**

- ✅ TypeScript for type safety (no additional validation like Zod)
- ✅ Only libraries that provide clear and real value
- ❌ NO libraries "just in case" or for theoretical "best practices"
- ❌ NO Zod or validation libraries - TypeScript is enough
- ❌ NO heavy ORMs until they're necessary
- ❌ NO UI component libraries until they're necessary

### Principle: Scale when necessary

We start with the minimum functional requirements. We add technology only when:
1. There's a clear and real need
2. It provides immediate value
3. It doesn't add unnecessary complexity to development

## CRITICAL RULE: English Only

### ALL code, comments, and documentation MUST be in English

**This is NON-NEGOTIABLE:**
- ✅ Variable names in English (e.g., `userName`, not `nombreUsuario`)
- ✅ Function names in English (e.g., `getCampaigns`, not `obtenerCampanas`)
- ✅ Comments in English
- ✅ Documentation in English
- ✅ Git commit messages in English
- ✅ Interface/Type names in English
- ✅ Console logs in English
- ✅ Error messages in English
- ✅ API endpoint names in English
- ✅ File names in English

**Examples:**

```typescript
// ✅ CORRECT
interface Campaign {
  name: string;
  startDate: string;
  endDate: string;
}

function getCampaigns(): Campaign[] {
  // Fetch all active campaigns
  return campaigns.filter(c => c.status === 'active');
}

// ❌ WRONG - Never do this
interface Campana {
  nombre: string;
  fechaInicio: string;
  fechaFin: string;
}

function obtenerCampanas(): Campana[] {
  // Obtener todas las campañas activas
  return campanas.filter(c => c.estado === 'activa');
}
```

**If you're unsure about how to translate something, ASK. Never write in Spanish.**

## Tech Stack

### Backend (Node.js API Gateway)

**Core:**
- Node.js 20.x
- Express 4.18
- TypeScript 5.3 (strict mode)

**Allowed libraries:**
- Helmet - Security (1 line, high value)
- CORS - Necessary for frontend
- Morgan - Professional logging

**DO NOT use:**
- ❌ Zod - TypeScript already provides the types
- ❌ class-validator
- ❌ Joi
- ❌ Any validation library

### Frontend (Web Dashboard)

**Core:**
- React 19.1
- Vite 7.1
- TypeScript 5.9 (strict mode)

**Libraries:** Only essentials. Add UI libraries only when necessary.

### App (Mobile)

**Core:**
- React Native 0.81
- Expo 54
- TypeScript 5.9

## Data Validation

### How to validate without Zod

Use TypeScript interfaces + simple validations:

```typescript
// types/campaign.ts
interface Campaign {
  name: string;
  startDate: string;
  endDate: string;
  status: 'active' | 'inactive';
}

// Simple validation
function isValidCampaign(data: any): data is Campaign {
  return (
    typeof data.name === 'string' &&
    data.name.length > 0 &&
    typeof data.startDate === 'string' &&
    typeof data.endDate === 'string' &&
    ['active', 'inactive'].includes(data.status)
  );
}

// In the endpoint
router.post('/campaigns', (req, res) => {
  if (!isValidCampaign(req.body)) {
    return res.status(400).json({ error: 'Invalid campaign data' });
  }

  const campaign: Campaign = req.body;
  // ...
});
```

**This is sufficient for an MVP.** We don't need Zod.

## Code Conventions

### Naming

- **TypeScript/JavaScript files:** camelCase (e.g., `userService.ts`)
- **React components:** PascalCase (e.g., `CampaignList.tsx`)
- **Variables and functions:** camelCase (e.g., `getUserData`)
- **Types and Interfaces:** PascalCase (e.g., `interface User {}`)
- **Constants:** UPPER_SNAKE_CASE (e.g., `const API_URL = ...`)

### File Structure

**Backend:**
```
backend/src/
├── index.ts           # Entry point
├── routes/            # Endpoints by domain
│   ├── campaigns.ts
│   └── loyalty.ts
├── types/             # TypeScript interfaces
│   └── campaign.ts
├── services/          # Business logic
│   └── djangoClient.ts
├── middleware/        # Custom middleware
│   └── auth.ts
└── utils/             # Utilities and validations
    └── validators.ts
```

**Frontend:**
```
frontend/src/
├── components/    # Reusable components
├── pages/        # Pages/views
├── hooks/        # Custom React hooks
├── services/     # API calls
├── types/        # TypeScript types
└── utils/        # Utilities
```

### Imports

Import order:
1. External libraries
2. Internal modules
3. Relative imports

```typescript
// 1. External
import express from 'express';
import { Router } from 'express';

// 2. Internal (when we have path aliases)
import type { Campaign } from '@/types/campaign';
import { validateCampaign } from '@/utils/validators';

// 3. Relative
import CampaignService from './services/campaign';
```

### Error Handling

**Backend - Always use try-catch:**
```typescript
router.get('/campaigns', async (req, res) => {
  try {
    const campaigns = await getCampaigns();
    res.json({ success: true, data: campaigns });
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch campaigns'
    });
  }
});
```

**Frontend - Handle API errors:**
```typescript
try {
  const response = await fetch('/api/campaigns');
  if (!response.ok) throw new Error('Failed to fetch');
  const data = await response.json();
  setCampaigns(data);
} catch (error) {
  console.error(error);
  setError('Unable to load campaigns');
}
```

### TypeScript

**Always use strict mode:**
```json
{
  "strict": true,
  "noUnusedLocals": true,
  "noUnusedParameters": true
}
```

**Prefer interfaces over types:**
```typescript
// ✅ Preferred
interface User {
  id: string;
  email: string;
}

// ❌ Avoid (use only for unions/intersections)
type User = {
  id: string;
  email: string;
}
```

**Don't use `any`:**
```typescript
// ❌ Avoid
function process(data: any) { }

// ✅ Use unknown and validate
function process(data: unknown) {
  if (typeof data === 'object' && data !== null) {
    // ...
  }
}
```

## Django Backend Integration

### Architecture

```
Client (Web/Mobile) → Node.js Gateway → Django Backend
```

Node.js acts as **API Gateway**:
- Proxy requests to Django
- JWT authentication
- Data transformation
- Marketing/campaigns logic

### Environment Variables

**Backend (.env):**
```bash
NODE_ENV=development
PORT=3001
DJANGO_API_URL=http://localhost:8000/api
JWT_SECRET=your-secret-key
CORS_ORIGIN=http://localhost:5173
```

### Example Django call

```typescript
// services/djangoClient.ts
const DJANGO_API = process.env.DJANGO_API_URL;

async function getUserFromDjango(userId: string) {
  const response = await fetch(`${DJANGO_API}/users/${userId}`);
  if (!response.ok) throw new Error('Failed to fetch user');
  return await response.json();
}
```

## Testing

**Philosophy:** Add tests only when we have critical code to test.

Don't add testing libraries at the beginning. Develop the MVP first.

## What NOT to do

### ❌ Don't install unnecessary libraries

```bash
# ❌ DON'T do this without asking
npm install zod joi yup class-validator
npm install @prisma/client typeorm drizzle-orm
npm install @mui/material @chakra-ui/react
```

### ❌ Don't add premature complexity

```typescript
// ❌ We don't need this now
import { z } from 'zod';
const schema = z.object({
  name: z.string().min(3).max(50),
  email: z.string().email(),
});

// ✅ TypeScript + simple validation is enough
interface User {
  name: string;
  email: string;
}

function isValidUser(data: any): data is User {
  return (
    typeof data.name === 'string' &&
    data.name.length >= 3 &&
    typeof data.email === 'string' &&
    data.email.includes('@')
  );
}
```

### ❌ Don't create unnecessary abstractions

Start simple. Refactor when we see repeated patterns.

### ❌ Don't write in Spanish

```typescript
// ❌ NEVER DO THIS
const nombreUsuario = "John";
function obtenerDatos() { }
// Error: No se pudo conectar

// ✅ ALWAYS DO THIS
const userName = "John";
function getData() { }
// Error: Could not connect
```

## What TO do

### ✅ Simple and direct code

```typescript
// ✅ Simple and clear endpoints
router.get('/campaigns', async (req, res) => {
  try {
    // Direct logic, no unnecessary layers
    const campaigns = await db.query('SELECT * FROM campaigns');
    res.json(campaigns);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});
```

### ✅ TypeScript for type safety

```typescript
// ✅ Clear types
interface Campaign {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
}

// ✅ Typed functions
async function getCampaign(id: string): Promise<Campaign> {
  // ...
}
```

### ✅ Ask before adding technology

If you think you need a library, **ASK THE USER** before installing it.

Explain:
1. What problem it solves
2. Why we can't do it with what we already have
3. What alternatives exist

### ✅ Always write in English

Before writing ANY code, variable, comment, or message, ask yourself: "Is this in English?"

If the answer is no, translate it first.

## Project Current Status

**Backend:**
- ✅ Express server running
- ✅ Middleware: Helmet, CORS, Morgan
- ✅ Endpoints: `/health`, `/api/v1`
- ⏳ Django connection (pending)
- ⏳ JWT authentication (pending)
- ⏳ Business endpoints (pending)

**Frontend:**
- ✅ Vite + React boilerplate
- ⏳ Dashboard UI (pending)
- ⏳ Backend integration (pending)

**App:**
- ✅ Expo project initialized
- ⏳ App UI (pending)
- ⏳ Backend integration (pending)

## Next Steps

1. Define MVP endpoints
2. Connect with Django backend
3. Implement basic JWT authentication
4. Design basic dashboard UI
5. Simple campaigns CRUD

## Resources

- **ARCHITECTURE.md** - Complete system architecture
- **CONVENTIONS.md** - Detailed code conventions
- **README.md** - How to run the project

---

**Remember:**
1. Simplicity first
2. TypeScript is enough
3. Don't add unnecessary libraries
4. **EVERYTHING in English - no exceptions**

**Last updated:** 2025-10-18