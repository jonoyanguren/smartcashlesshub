# Smart Cashless Hub - Code Conventions

## 1. Language Requirements

### CRITICAL RULE: English Only

**ALL code, comments, documentation, and messages MUST be written in English.**

This is non-negotiable and applies to:

- ✅ Variable names
- ✅ Function names
- ✅ Class names
- ✅ Interface/Type names
- ✅ Comments
- ✅ Documentation
- ✅ Error messages
- ✅ Console logs
- ✅ Git commit messages
- ✅ File names
- ✅ Folder names
- ✅ API endpoint names
- ✅ Database column names (future)

### Examples

**✅ CORRECT:**
```typescript
// Fetch user data from Django API
interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

async function getUserById(userId: string): Promise<User> {
  try {
    const response = await fetch(`/api/users/${userId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch user');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching user:', error);
    throw error;
  }
}
```

**❌ WRONG - Never do this:**
```typescript
// Obtener datos del usuario desde la API de Django
interface Usuario {
  id: string;
  email: string;
  nombre: string;
  apellido: string;
}

async function obtenerUsuarioPorId(idUsuario: string): Promise<Usuario> {
  try {
    const respuesta = await fetch(`/api/usuarios/${idUsuario}`);
    if (!respuesta.ok) {
      throw new Error('No se pudo obtener el usuario');
    }
    return await respuesta.json();
  } catch (error) {
    console.error('Error al obtener usuario:', error);
    throw error;
  }
}
```

## 2. Development Philosophy

### Simplicity First

**MVP without unnecessary complexity:**

1. **Use TypeScript for type safety** - No Zod, Joi, Yup, or other validation libraries
2. **Add libraries only when they provide clear value** - Not "just in case"
3. **Don't add technology for theoretical "best practices"** - Solve real problems
4. **Scale with libraries when truly necessary** - Not before

### What we DO use

- ✅ Express - Core framework
- ✅ TypeScript - Native type safety
- ✅ Helmet - Security headers (simple, high value)
- ✅ CORS - Necessary for cross-origin requests
- ✅ Morgan - Professional HTTP logging
- ✅ React, Vite, Expo - Essential tooling

### What we DON'T use (for MVP)

- ❌ Zod / Joi / Yup - TypeScript types are sufficient
- ❌ Prisma / TypeORM / Drizzle - Until we need an ORM
- ❌ MUI / Chakra / shadcn/ui - Until we need a component library
- ❌ Redux / Zustand - Until we need complex state management
- ❌ React Query / SWR - Until we need advanced data fetching

## 3. Naming Conventions

### Files and Folders

- **TypeScript/JavaScript files:** `camelCase.ts` or `camelCase.tsx`
  - Examples: `userService.ts`, `authMiddleware.ts`, `campaignValidator.ts`
- **React Component files:** `PascalCase.tsx`
  - Examples: `CampaignList.tsx`, `UserProfile.tsx`, `DashboardLayout.tsx`
- **Folders:** `camelCase` or `kebab-case` (be consistent)
  - Examples: `components/`, `services/`, `utils/`

### Variables and Functions

- **Variables:** `camelCase`
  ```typescript
  const userName = "John";
  const campaignList = [];
  let isAuthenticated = false;
  ```

- **Functions:** `camelCase`
  ```typescript
  function getUserData() { }
  async function fetchCampaigns() { }
  const handleSubmit = () => { };
  ```

- **Boolean variables:** Prefix with `is`, `has`, `should`, `can`
  ```typescript
  const isActive = true;
  const hasPermission = false;
  const shouldRender = true;
  const canEdit = false;
  ```

### Types and Interfaces

- **Interfaces:** `PascalCase`
  ```typescript
  interface User { }
  interface Campaign { }
  interface ApiResponse { }
  ```

- **Types:** `PascalCase`
  ```typescript
  type UserId = string;
  type Status = 'active' | 'inactive';
  ```

- **Prefer interfaces over types** for object shapes:
  ```typescript
  // ✅ Preferred
  interface User {
    id: string;
    email: string;
  }

  // ❌ Avoid (use only for unions, intersections, primitives)
  type User = {
    id: string;
    email: string;
  }
  ```

### Constants

- **Constants:** `UPPER_SNAKE_CASE`
  ```typescript
  const API_URL = 'http://localhost:3001';
  const MAX_RETRIES = 3;
  const DEFAULT_PAGE_SIZE = 50;
  ```

- **Enum-like constants:**
  ```typescript
  const HTTP_STATUS = {
    OK: 200,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    NOT_FOUND: 404,
  } as const;
  ```

### React Components

- **Component names:** `PascalCase`
  ```typescript
  function CampaignList() { }
  const UserProfile = () => { };
  ```

- **Component props interfaces:** `ComponentNameProps`
  ```typescript
  interface CampaignListProps {
    campaigns: Campaign[];
    onSelect: (id: string) => void;
  }

  function CampaignList({ campaigns, onSelect }: CampaignListProps) {
    // ...
  }
  ```

## 4. TypeScript Conventions

### Configuration

**Always use strict mode:**
```json
{
  "compilerOptions": {
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

### Type Safety

**Never use `any`:**
```typescript
// ❌ Don't do this
function process(data: any) {
  return data.value;
}

// ✅ Use unknown and type guards
function process(data: unknown) {
  if (typeof data === 'object' && data !== null && 'value' in data) {
    return (data as { value: string }).value;
  }
  throw new Error('Invalid data');
}

// ✅ Or use proper typing
interface ProcessData {
  value: string;
}

function process(data: ProcessData) {
  return data.value;
}
```

**Use type predicates for validation:**
```typescript
interface Campaign {
  name: string;
  startDate: string;
  endDate: string;
}

function isCampaign(data: unknown): data is Campaign {
  return (
    typeof data === 'object' &&
    data !== null &&
    'name' in data &&
    'startDate' in data &&
    'endDate' in data &&
    typeof (data as any).name === 'string' &&
    typeof (data as any).startDate === 'string' &&
    typeof (data as any).endDate === 'string'
  );
}
```

**Prefer `interface` over `type` for objects:**
```typescript
// ✅ Preferred for object shapes
interface User {
  id: string;
  email: string;
}

// ✅ Use type for unions, intersections, primitives
type Status = 'active' | 'inactive' | 'pending';
type UserId = string;
type UserWithTimestamps = User & {
  createdAt: string;
  updatedAt: string;
};
```

## 5. Data Validation

### No Validation Libraries - Use TypeScript

**We don't use Zod, Joi, Yup, or any validation library.**

TypeScript types + simple validation functions are sufficient for MVP.

**Pattern:**
```typescript
// 1. Define interface
interface CreateCampaignRequest {
  name: string;
  startDate: string;
  endDate: string;
  type: 'discount' | 'promotion' | 'loyalty';
}

// 2. Create validation function
function isValidCreateCampaignRequest(data: any): data is CreateCampaignRequest {
  return (
    typeof data === 'object' &&
    data !== null &&
    typeof data.name === 'string' &&
    data.name.length > 0 &&
    data.name.length <= 100 &&
    typeof data.startDate === 'string' &&
    typeof data.endDate === 'string' &&
    ['discount', 'promotion', 'loyalty'].includes(data.type)
  );
}

// 3. Use in endpoint
router.post('/campaigns', async (req, res) => {
  if (!isValidCreateCampaignRequest(req.body)) {
    return res.status(400).json({
      error: 'Invalid request data'
    });
  }

  const campaign: CreateCampaignRequest = req.body;
  // TypeScript knows the exact shape now
});
```

## 6. Error Handling

### Backend (Express)

**Always use try-catch for async operations:**
```typescript
router.get('/campaigns', async (req, res) => {
  try {
    const campaigns = await getCampaigns();
    res.json({
      success: true,
      data: campaigns
    });
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch campaigns'
    });
  }
});
```

**Consistent error response format:**
```typescript
interface ErrorResponse {
  success: false;
  error: string;
  details?: any; // Only in development
}

interface SuccessResponse<T> {
  success: true;
  data: T;
}

type ApiResponse<T> = SuccessResponse<T> | ErrorResponse;
```

### Frontend (React)

**Handle API errors gracefully:**
```typescript
async function fetchCampaigns() {
  try {
    const response = await fetch('/api/campaigns');

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    setCampaigns(data);
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    setError('Unable to load campaigns. Please try again.');
  }
}
```

## 7. Import Organization

**Order:**
1. External libraries (react, express, etc.)
2. Internal modules with path aliases (when configured)
3. Relative imports

**Format:**
```typescript
// 1. External libraries
import express from 'express';
import { Router, Request, Response } from 'express';
import cors from 'cors';

// 2. Internal modules (when we have path aliases)
import type { Campaign } from '@/types/campaign';
import type { User } from '@/types/user';
import { validateCampaign } from '@/utils/validators';
import { authMiddleware } from '@/middleware/auth';

// 3. Relative imports
import CampaignService from './services/campaignService';
import { formatDate } from './utils/dateUtils';
```

**Group related imports:**
```typescript
// Types
import type { Campaign, CampaignRule } from '@/types/campaign';
import type { User, UserRole } from '@/types/user';

// Services
import CampaignService from '@/services/campaignService';
import UserService from '@/services/userService';

// Utils
import { validateCampaign } from '@/utils/validators';
import { formatDate } from '@/utils/dateUtils';
```

## 8. Comments

### When to Comment

- **Explain WHY, not WHAT**
- **Document complex business logic**
- **Clarify non-obvious decisions**
- **Add TODO/FIXME when appropriate**

### Good Comments

```typescript
// ✅ Explains WHY
// Use pagination to avoid memory issues with large datasets
const campaigns = await getCampaigns({ limit: 50, offset: 0 });

// ✅ Explains complex logic
// Calculate points based on tier: Bronze=1x, Silver=1.5x, Gold=2x
const points = amount * getTierMultiplier(userTier);

// ✅ Documents business rule
// Campaigns can only be edited if status is 'draft' or 'scheduled'
if (!['draft', 'scheduled'].includes(campaign.status)) {
  throw new Error('Cannot edit active campaign');
}
```

### Bad Comments

```typescript
// ❌ States the obvious
// Get campaigns
const campaigns = await getCampaigns();

// ❌ Redundant with code
// Set user name to John
const userName = 'John';

// ❌ In Spanish - NEVER DO THIS
// Obtener todas las campañas activas
const campaigns = await getActiveCampaigns();
```

### TODO/FIXME

```typescript
// TODO: Add pagination support
// FIXME: Handle edge case when user has no campaigns
// NOTE: This is a temporary solution until we implement X
```

## 9. Function and Method Structure

### Function Length

- **Keep functions small and focused** (< 50 lines ideally)
- **Single Responsibility Principle** - Each function does one thing
- **Extract complex logic into separate functions**

### Function Parameters

- **Maximum 3-4 parameters** - Use object destructuring for more
- **Required parameters first, optional last**

```typescript
// ✅ Good: Few parameters
function createCampaign(name: string, startDate: string, endDate: string) { }

// ✅ Better: Object for many parameters
interface CreateCampaignParams {
  name: string;
  startDate: string;
  endDate: string;
  type: CampaignType;
  rules?: CampaignRule[];
}

function createCampaign(params: CreateCampaignParams) { }

// ❌ Avoid: Too many parameters
function createCampaign(
  name: string,
  startDate: string,
  endDate: string,
  type: string,
  rules: any[],
  tenantId: string,
  userId: string
) { }
```

### Return Types

**Always specify return types for functions:**
```typescript
// ✅ Explicit return type
async function getCampaigns(): Promise<Campaign[]> {
  // ...
}

function formatDate(date: string): string {
  // ...
}

// ❌ Avoid implicit return types
async function getCampaigns() {
  // ...
}
```

## 10. Code Formatting

### Indentation and Spacing

- **2 spaces** for indentation (already configured in tsconfig)
- **No trailing whitespace**
- **Empty line between logical blocks**

### Line Length

- **Aim for 80-100 characters per line**
- **Break long lines at logical points**

```typescript
// ✅ Good
const result = await someVeryLongFunctionName(
  parameter1,
  parameter2,
  parameter3
);

// ❌ Avoid long lines
const result = await someVeryLongFunctionName(parameter1, parameter2, parameter3, parameter4, parameter5);
```

### Quotes

- **Single quotes for strings** (configured in ESLint)
- **Template literals for interpolation**

```typescript
// ✅ Good
const name = 'John';
const greeting = `Hello, ${name}!`;

// ❌ Avoid
const name = "John";
const greeting = 'Hello, ' + name + '!';
```

## 11. Git Commit Messages

### Format

**Use conventional commits format:**

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**
```
feat(campaigns): add campaign creation endpoint

Implement POST /api/campaigns endpoint with validation
using TypeScript type guards instead of Zod.

Closes #123
```

```
fix(auth): handle missing JWT token gracefully

Return 401 with clear error message instead of crashing
when Authorization header is missing.
```

```
docs: update architecture documentation

Add English-only rule and simplicity-first philosophy
to all documentation files.
```

### Rules

- **Write in English** - Always
- **Use imperative mood** - "Add feature" not "Added feature"
- **Keep subject line under 72 characters**
- **Explain WHAT and WHY, not HOW**

## 12. File Organization

### Backend Structure

```
backend/src/
├── index.ts              # Entry point, Express app setup
├── routes/               # Route handlers by domain
│   ├── campaigns.ts      # Campaign endpoints
│   ├── loyalty.ts        # Loyalty endpoints
│   └── notifications.ts  # Notification endpoints
├── types/                # TypeScript type definitions
│   ├── campaign.ts       # Campaign interfaces
│   ├── user.ts           # User interfaces
│   └── common.ts         # Shared types
├── services/             # Business logic
│   ├── djangoClient.ts   # Django API client
│   ├── campaignService.ts
│   └── loyaltyService.ts
├── middleware/           # Express middleware
│   ├── auth.ts           # JWT authentication
│   ├── errorHandler.ts   # Global error handler
│   └── requestLogger.ts  # Request logging
└── utils/                # Utility functions
    ├── validators.ts     # Validation functions
    └── dateHelpers.ts    # Date utilities
```

### Frontend Structure

```
frontend/src/
├── main.tsx              # Entry point
├── App.tsx               # Root component
├── components/           # Reusable components
│   ├── CampaignCard.tsx
│   ├── UserTable.tsx
│   └── common/           # Shared components
│       ├── Button.tsx
│       └── Modal.tsx
├── pages/                # Page components
│   ├── Dashboard.tsx
│   ├── Campaigns.tsx
│   └── Login.tsx
├── hooks/                # Custom React hooks
│   ├── useCampaigns.ts
│   └── useAuth.ts
├── services/             # API calls
│   └── api.ts            # API client
├── types/                # TypeScript types
│   ├── campaign.ts
│   └── user.ts
└── utils/                # Utility functions
    └── formatters.ts
```

## 13. Testing (Future)

**For now: No testing libraries.**

When we add tests:
- Use Jest or Vitest
- Follow AAA pattern (Arrange, Act, Assert)
- Test critical business logic first
- All test names in English

## 14. Security Best Practices

### Environment Variables

- **Never commit `.env` files**
- **Always use `.env.example` as template**
- **Validate required env vars on startup**

```typescript
// Example: Validate environment variables
const requiredEnvVars = ['DJANGO_API_URL', 'JWT_SECRET', 'PORT'];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}
```

### Input Validation

- **Never trust user input**
- **Validate all request data**
- **Sanitize before using in queries**

### Authentication

- **Use JWT tokens**
- **Store tokens securely** (HttpOnly cookies or secure storage)
- **Validate tokens on every protected route**

## 15. Performance Considerations

### Database Queries (Future)

- **Use pagination for large datasets**
- **Index frequently queried fields**
- **Avoid N+1 queries**

### API Responses

- **Only send necessary data**
- **Use appropriate HTTP status codes**
- **Consider response compression**

## Summary Checklist

Before committing code, verify:

- [ ] All code is in English (variables, functions, comments)
- [ ] TypeScript strict mode is satisfied (no errors)
- [ ] No `any` types used
- [ ] Proper error handling with try-catch
- [ ] Consistent naming conventions followed
- [ ] Comments explain WHY, not WHAT
- [ ] Imports are organized properly
- [ ] No unnecessary libraries added
- [ ] Code is simple and maintainable
- [ ] Git commit message is in English and follows conventions

---

**Last updated:** 2025-10-18
**Version:** 1.0