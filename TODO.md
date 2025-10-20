# Smart Cashless - Project TODO

> Last updated: 2025-10-20

## How to use this file:

1. **Start of day**: Review high priority items
2. **When working with Claude**: Reference specific items from this list
3. **After completing tasks**: Move items to "Recently Completed" with commit hash
4. **New ideas**: Add to backlog or ideas section
5. **Found a bug**: Add to known issues immediately

---

## 🎯 Current Sprint / High Priority

- [ ]

---

## 🔥 Critical Issues / Bugs

- [ ]

---

## 📋 Backlog

### Features
- [ ] User invitation system: Send email with secure link when admin creates user (currently shows password in modal) - **USE BREVO**
- [ ] Polling on the events page to do a "real time" statistics. The tenant users would be able to see updated data in the event statistics page. The two ideas for this would be to do a update button or do a polling every X seconds. Or maybe do both.
- [ ] The refresh control of the event statistics page make it in a component.
- [ ] Improve the UX/UI on the events depending on the status. If an event is live now we should show the update and polling information. If the event is draft or not started we should not show the View stats button.
- [ ] Email notifications system, this would be used for campaigns. The tenant will be able to create an offer and send a campaign to the users with previous filtering. Example "A campaing that is created to buy the presales ticket with a bracalet and we charge you 10 euros more if you buy today" send a great designed email for the users selected.  - **Brevo tool**
- [ ] Export reports (PDF/Excel) for payments and events
- [ ] Multi-language support in backend (currently only frontend has i18n)
- [ ] Webhook system for external integrations
- [ ] Analytics dashboard with charts (recharts or chart.js)
- [ ] QR code generation for events. The QR code will be for the payments as same as if the user has the bracelet. This would be need to be integrated with django so the QR has the bracelet id.
- [ ] Loyalty/rewards program
- [ ] Gamification
- [ ] Mobile responsive improvements in the FRONTEND
- [ ] Logging infrastructure (winston or pino) in the API
- [ ] API rate limiting (express-rate-limit)

### Mobile app
- [ ] Start the mobile app

### Technical Debt
- [ ] Add comprehensive unit tests (Jest/Vitest)
- [ ] Add integration tests for API endpoints
- [ ] E2E tests for critical flows (Playwright)
- [ ] Set up CI/CD pipeline (GitHub Actions)
- [ ] Database migration strategy documentation
- [ ] Add monitoring and alerting (Sentry for errors)
- [ ] Performance optimization (caching with Redis)

### DevOps
- [ ] Docker containerization (Dockerfile + docker-compose)
- [ ] Production deployment setup (VPS/Cloud). We would use Hetzner service.
- [ ] Backup strategy for PostgreSQL
- [ ] Environment configuration management
- [ ] SSL/HTTPS setup
- [ ] Database connection pooling

---

## 📚 Documentation Needed

- [ ] API documentation (Swagger UI)
- [ ] Setup/installation guide
- [ ] Architecture documentation (with diagrams)
- [ ] User manual for dashboard
- [ ] Deployment guide
- [ ] Database schema documentation

---

## ✅ Recently Completed

### Infrastructure & Core
- [x] Prisma schema with multi-tenant architecture (Tenant, User, TenantUser, Event, Payment)
- [x] PostgreSQL database setup
- [x] Backend API structure (Express + TypeScript)
- [x] Frontend structure (React + Vite + TypeScript + Tailwind)

### Authentication
- [x] JWT authentication (access + refresh tokens) - backend/src/auth/
- [x] Password hashing with bcrypt - backend/src/auth/auth.controller.ts
- [x] Change password functionality - backend/src/auth/auth.controller.ts:241
- [x] Auth middleware - backend/src/middleware/auth.middleware.ts
- [x] Protected routes in frontend - frontend/src/components/auth/ProtectedRoute.tsx

### Backend API Endpoints
- [x] Tenant CRUD operations - backend/src/tenant/
- [x] User CRUD operations - backend/src/user/
- [x] Event CRUD operations - backend/src/event/
- [x] Admin endpoints - backend/src/admin/
- [x] Error handling with error codes - backend/src/constants/errorCodes.ts

### Frontend Pages & Components
- [x] Login page - frontend/src/pages/LoginPage.tsx
- [x] Change password page - frontend/src/pages/ChangePasswordPage.tsx
- [x] Dashboard layout - frontend/src/layouts/DashboardLayout.tsx
- [x] Overview page with last activity - frontend/src/pages/dashboard/OverviewPage.tsx
- [x] Users page - frontend/src/pages/dashboard/UsersPage.tsx
- [x] Events page - frontend/src/pages/dashboard/EventsPage.tsx
- [x] Event stats page - frontend/src/pages/dashboard/EventStatsPage.tsx
- [x] Settings page - frontend/src/pages/dashboard/SettingsPage.tsx
- [x] Create user modal with password display - frontend/src/components/users/
- [x] Create event modal - frontend/src/components/events/CreateEventModal.tsx
- [x] i18n support (multi-language) - frontend/src/i18n/

### Data
- [x] Events and payments with seed data (d7a62a7)
- [x] Stats page (be79827)
- [x] Last activity in overview page (609bea8)
- [x] Users and roles basic structure (70040db)
- [x] Events basic implementation (f969f80)

### User Detail Feature
- [x] User detail page with payment summary and history - frontend/src/pages/dashboard/UserDetailPage.tsx
- [x] Enhanced backend API to include payment data - backend/src/user/user.controller.ts:103
- [x] Payment summary stats (total spent, transactions, avg transaction, etc.)
- [x] Payment history table with event details
- [x] Navigation from Users page with "View" button - frontend/src/pages/dashboard/UsersPage.tsx:365
- [x] Route added for /dashboard/users/:id - frontend/src/App.tsx:49
- [x] Events attended section showing all events user has been to
- [x] Filters for payment history (by event and date range)
- [x] Filtered payment table with real-time updates

### Tenant Configuration & Branding System
- [x] Backend API endpoints for tenant configuration - backend/src/tenant/tenant.controller.ts:249
- [x] Tenant metadata structure in Prisma schema for storing branding
- [x] Frontend API functions for tenant config - frontend/src/api/tenants.ts
- [x] TenantConfigPage with color pickers and logo inputs - frontend/src/pages/dashboard/TenantConfigPage.tsx
- [x] Color configuration for primary, secondary, and accent colors
- [x] Logo and hero image URL inputs (removed favicon)
- [x] Hero image displayed in EventPreviewPage - frontend/src/pages/dashboard/EventPreviewPage.tsx:106-118
- [x] Comprehensive documentation in TenantConfigPage (where images are used, recommended sizes, formats)
- [x] Live preview of colors
- [x] Route added for /dashboard/config - frontend/src/App.tsx:52
- [x] Error code added for tenant branding - backend/src/constants/errorCodes.ts:21
- [x] TenantBrandingContext for global branding state - frontend/src/contexts/TenantBrandingContext.tsx
- [x] CSS variables applied globally (--color-primary, --color-secondary, --color-accent, etc.)
- [x] Auto-refresh branding when config is saved
- [x] Branding navigation item in sidebar - frontend/src/layouts/DashboardLayout.tsx:60
- [x] Logo displayed in OverviewPage - frontend/src/pages/dashboard/OverviewPage.tsx:196
- [x] Logo displayed in EventPreviewPage - frontend/src/pages/dashboard/EventPreviewPage.tsx:130
- [x] Tenant colors applied in OverviewPage (card, stats icons)
- [x] Full i18n support for branding configuration (EN + ES) - frontend/src/locales/*/dashboard.json

### Event Images System (commit: add images to events)
- [x] Added `images` field to Event model in Prisma schema - backend/prisma/schema.prisma:23
- [x] Database migration created and applied - backend/prisma/migrations/.../add_images_to_events
- [x] Backend validation for images array in create/update endpoints - backend/src/event/event.controller.ts:128,210
- [x] Error code added: EVENT_INVALID_IMAGES - backend/src/constants/errorCodes.ts:46
- [x] Updated Event and CreateEventRequest types with images field - frontend/src/api/events.ts:17,33
- [x] Image management in CreateEventModal - frontend/src/components/events/CreateEventModal.tsx:343-390
  - Input for adding image URLs with Enter key support
  - Visual list with thumbnail previews (64x64px)
  - Remove button for each image
  - Error handling for failed image loads
- [x] Image carousel in EventPreviewPage - frontend/src/pages/dashboard/EventPreviewPage.tsx:152-200
  - Full-width carousel (h-96) with rounded borders
  - Previous/Next navigation buttons (only shown if multiple images)
  - Dot indicators for current slide
  - Smooth transitions and error handling
- [x] Fixed capacity validation inconsistency (backend now requires capacity >= 1 or undefined for unlimited)
- [x] i18n support with defaultValue fallbacks for new image-related keys

---

## 💡 Ideas / Future Considerations

- Integration with payment gateways (Stripe, PayPal)
- Social media sharing for events
- Customer feedback system
- Real-time notifications (Socket.io)
- Mobile app development (React Native/Expo)
- Advanced analytics with ML predictions
- Guest list management
- Ticket scanning system

---

## 🐛 Known Issues

- User creation shows plain password in modal (needs email invitation system)
- No pagination on list endpoints (may cause performance issues with large datasets)
- No API rate limiting (vulnerable to abuse)
- Missing request validation on some endpoints

---

## 📝 Notes

### Tech Stack
- **Backend**: Node.js 20+, Express, TypeScript, Prisma, PostgreSQL, bcryptjs, JWT, Zod
- **Frontend**: React 19, Vite, TypeScript, Tailwind CSS, react-router-dom, i18next
- **Mobile**: Expo, React Native (basic structure in /app)
- **Database**: PostgreSQL with Prisma ORM

### Architecture
- Multi-tenant SaaS architecture
- JWT-based authentication with refresh tokens
- Role-based access control (SUPERADMIN, TENANT_ADMIN, TENANT_STAFF, END_USER)
- RESTful API design

### Email Provider
- **Brevo** (formerly Sendinblue) will be used for email notifications

---

