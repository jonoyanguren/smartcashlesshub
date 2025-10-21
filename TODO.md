# Smart Cashless - Project TODO

> Last updated: 2025-10-21 (Logging infrastructure completed)

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

- [ ] None currently 

---

## 📋 Backlog

### Features
- [ ] Push Notifications System
    - **Phase 1: Base Notification Service** (backend/src/notifications/notifications.service.ts)
      - Install Firebase Admin SDK
      - Create notification service with core functions:
        - sendPushToUser(userId, notification)
        - sendPushToAll(eventId, notification)
        - sendPushToSegment(eventId, filters, notification)
      - Add fcmToken field to User model in Prisma schema
      - Create ScheduledNotification model in Prisma (title, message, scheduledFor, status, etc.)
      - Integration with Firebase Cloud Messaging (FCM)
      - Store notification history in database
    - **Phase 2: Immediate Notifications API** (backend/src/notifications/notifications.controller.ts)
      - POST /api/v1/notifications/send - Send immediate notification
      - Endpoint to send to all users of an event
      - Endpoint to send to specific users
      - Endpoint to send to filtered segment (active users, etc.)
      - Error handling and retry logic
    - **Phase 3: Scheduling System with Redis + Bull** (backend/src/notifications/notification.queue.ts)
      - Install Bull and Redis (ioredis)
      - Set up Redis server (add to docker-compose.yml)
      - Create notification queue with Bull
      - Create worker process (notification.worker.ts) to process scheduled jobs
      - POST /api/v1/notifications/schedule - Schedule notification for future
      - GET /api/v1/notifications/scheduled - List scheduled notifications
      - DELETE /api/v1/notifications/schedule/:id - Cancel scheduled notification
      - Support for delay calculation (schedule for specific datetime)
      - Retry logic with exponential backoff
      - Job persistence (survives server restarts)
    - **Phase 4: Automatic Threshold Notifications**
      - Integration in reward.service.ts - Send push when user earns reward
      - Integration in payment flow - Check thresholds after each payment
      - Configurable threshold rules in Reward model
      - Prevent duplicate notifications for same reward
    - **Phase 5: Dashboard UI** (frontend/src/components/eventManage/NotificationsSection.tsx)
      - Add Notifications tab to EventManagePage
      - Form to send immediate notifications (title, message, recipients)
      - Form to schedule notifications (title, message, datetime, recipients)
      - List of scheduled notifications with cancel option
      - Preview notification before sending
      - Recipient selector: All users, Active users, Custom segment
      - Notification templates for common messages (promotions, updates, etc.)
    - **Phase 6: Mobile App Integration**
      - Register FCM token when user logs in
      - Handle push notifications in foreground/background
      - Deep linking from notifications to specific screens
      - Notification permissions handling
    - **Phase 7: Monitoring & Analytics** (Optional)
      - Install Bull Board for job queue visualization
      - Dashboard showing sent/pending/failed notifications
      - Analytics: open rate, click rate, conversion rate
      - Notification history per user
- [ ] Packages and Rewards: remaining work
    - Purchase flow (create PackagePurchase, payment, status transitions)
    - Django integration for bracelet activation (sync bracelet IDs)
    - Enforcement: maxQuantity, maxPerUser, validity window on purchase
    - Public packages/rewards endpoints for mobile app (read-only)
    - Reward redemption flow (automatic trigger when user reaches limits)
- [ ] Make all the pages have all the information.
    - In the event page, have the event offers, and the event users
    - In the user page, have the events assisted, offers and payments purchases
- [ ] User invitation system: Send email with secure link when admin creates user (currently shows password in modal) - **USE BREVO**
- [ ] Email notifications system, this would be used for campaigns. The tenant will be able to create an offer and send a campaign to the users with previous filtering. Example "A campaing that is created to buy the presales ticket with a bracalet and we charge you 10 euros more if you buy today" send a great designed email for the users selected.  - **Brevo tool**
- [ ] Multi-language support in backend (currently only frontend has i18n)
- [ ] Analytics dashboard with charts (recharts or chart.js)
- [ ] QR code generation for events. The QR code will be for the payments as same as if the user has the bracelet. This would be need to be integrated with django so the QR has the bracelet id.
- [ ] Loyalty/rewards program
- [ ] Gamification
- [ ] Mobile responsive improvements in the FRONTEND
- [ ] API rate limiting (express-rate-limit) - **Not urgent with current client base**
  - Purpose: Limit requests per client/IP to prevent abuse and protect server resources
  - Use cases:
    - Report exports: 50 per day (CPU/memory intensive operations)
    - Event creation: 20 per hour
    - User creation: 10 per hour
    - General API: 100 requests per minute
  - Benefits: Prevents DDoS attacks, bot scraping, and resource exhaustion
  - Implementation: express-rate-limit middleware with different limits per route
  - When to implement: When client base grows or experiencing abuse/high traffic

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

### Package & Reward System (Refactored from Offers)
**Context**: Simplified the Offers system by splitting into two distinct entities:
- **Package**: Pre-event purchasable products (users pay) - Example: "100€ with 2 bracelets of 50€ + 5€ each"
- **Reward**: Event-based automatic promotions (free to users) - Example: "Spend 150€ → Get 10€ recharge"

#### Backend Implementation
- [x] Complete database schema refactoring - backend/prisma/schema.prisma:254-509
  - Package model with originalPrice for discount display (~~10€~~ **8€**)
  - PackageItem, PackagePurchase models for package contents
  - Reward model with trigger types (MINIMUM_SPEND, TRANSACTION_COUNT)
  - RewardRedemption model for tracking user redemptions
  - Removed old Offer, OfferItem, OfferPurchase models
- [x] Database migration and cleanup
  - Manually dropped old offer tables (offers, offer_items, offer_purchases)
  - Applied new schema with `npx prisma db push --accept-data-loss`
  - Regenerated Prisma client
- [x] Package backend module - backend/src/package/
  - package.controller.ts: CRUD operations with Decimal conversion helpers
  - package.routes.ts: RESTful routes (GET, POST, PUT, DELETE /api/v1/packages)
- [x] Reward backend module - backend/src/reward/
  - reward.controller.ts: CRUD with trigger-specific validation
  - reward.routes.ts: RESTful routes (GET, POST, PUT, DELETE /api/v1/rewards)
- [x] Error codes updated - backend/src/constants/errorCodes.ts:77-111
  - PACKAGE_NOT_FOUND, PACKAGE_EXPIRED, PACKAGE_SOLD_OUT, PACKAGE_MAX_PER_USER_EXCEEDED
  - REWARD_NOT_FOUND, REWARD_DEPLETED, REWARD_MAX_REDEMPTIONS_EXCEEDED, REWARD_USER_NOT_QUALIFIED
- [x] Routes registered in main app - backend/src/index.ts
- [x] Removed old offer directory - backend/src/offer/

#### Frontend Implementation
- [x] Centralized event management UX - frontend/src/pages/dashboard/EventManagePage.tsx
  - "Manage Event" button on event cards - EventsPage.tsx
  - Tabbed interface: Pre-event (Packages) and Event (Rewards)
  - Route: /dashboard/events/:id/manage - App.tsx:49
- [x] Package management section - frontend/src/components/eventManage/PackagesSection.tsx
  - Card-based list view with discount pricing display (crossed-out originalPrice)
  - Create/edit/delete operations
  - Status badges (DRAFT, ACTIVE, INACTIVE)
- [x] Reward management section - frontend/src/components/eventManage/RewardsSection.tsx
  - Dynamic trigger labels (minimum spend vs transaction count)
  - Reward type display (recharge amount vs discount percentage)
  - Redemption tracking (current/max redemptions)
- [x] CreatePackageModal - frontend/src/components/eventManage/CreatePackageModal.tsx
  - Form with price + originalPrice for discounts
  - Max quantity and per-user limits
  - Status management (edit mode only)
  - Items management (name, type, quantity, value)
- [x] CreateRewardModal - frontend/src/components/eventManage/CreateRewardModal.tsx
  - Dynamic fields based on trigger type (spend vs transaction)
  - Dynamic fields based on reward type (recharge vs percentage)
  - Redemption limits configuration
- [x] Frontend API modules with try/catch error handling
  - frontend/src/api/packages.ts: All CRUD functions with proper error handling
  - frontend/src/api/rewards.ts: All CRUD functions with proper error handling
  - All API calls wrap callApi() in try/catch blocks per requirement
- [x] Removed old Offers code
  - Deleted frontend/src/pages/dashboard/OffersPage.tsx
  - Deleted frontend/src/components/offers/ directory
  - Deleted frontend/src/api/offers.ts
  - Removed Offers navigation from DashboardLayout.tsx
- [x] Full i18n support (EN + ES) - frontend/src/locales/en/dashboard.json
  - manage.* keys for tab labels and titles
  - packages.* keys for all package-related UI
  - rewards.* keys for all reward-related UI
  - All with defaultValue fallbacks

#### Documentation
- [x] Comprehensive system documentation - backend/PACKAGES_AND_REWARDS.md
  - Architecture explanation
  - Database schema details
  - API endpoints reference
  - Key differences between Package and Reward
  - Django integration points
  - Migration notes from old Offers system

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

### Event Statistics Auto-Refresh System (commit: auto update in event stats)
- [x] Real-time statistics polling for ACTIVE events - frontend/src/pages/dashboard/EventDetailStatsPage.tsx
- [x] Manual refresh button with loading animation - EventDetailStatsPage.tsx:167-187
  - Spinning refresh icon when refreshing
  - Disabled state during refresh to prevent multiple requests
- [x] Auto-refresh toggle checkbox - EventDetailStatsPage.tsx:199-209
  - Only shown for ACTIVE events (line 162)
  - Uses React state management for toggle
- [x] Configurable refresh interval selector - EventDetailStatsPage.tsx:211-222
  - 1 minute (60s) - default
  - 3 minutes (180s)
  - 5 minutes (300s)
- [x] Last updated timestamp with "time ago" format - EventDetailStatsPage.tsx:92-105, 190-194
  - Shows "just now", "Xs ago", "Xm ago", "Xh ago"
  - Updates automatically as time passes
- [x] Auto-refresh effect with interval management - EventDetailStatsPage.tsx:27-44
  - Uses useRef to track interval ID
  - Proper cleanup on component unmount
  - Clears interval when auto-refresh is disabled
- [x] Payment stats integration - EventDetailStatsPage.tsx:64-76, 78-90
  - Loads from Django backend via getEventPaymentStats API
  - Updates revenue, transactions, and hourly charts in real-time
- [x] UX improvements for ACTIVE events
  - "LIVE NOW" badge with pulse animation - EventDetailStatsPage.tsx:152-157
  - Refresh controls only shown for ACTIVE events
  - Visual feedback during data refresh
- [x] State management with multiple loading states - EventDetailStatsPage.tsx:14-17
  - loading: Initial page load
  - statsLoading: First stats load
  - refreshing: Manual/auto refresh in progress
  - Prevents UI jank during updates
- [x] i18n support for all refresh-related UI text

### Reports Export System
- [x] Backend dependencies installed - exceljs, csv-writer, pdfkit, @types/pdfkit
- [x] Reports module structure created - backend/src/reports/
  - reports.service.ts: Generator functions for all formats and report types
  - reports.controller.ts: 4 API endpoints for different report types
  - reports.routes.ts: Protected routes with auth middleware
- [x] Backend API endpoints - backend/src/reports/reports.controller.ts
  - `/api/v1/reports/event-stats/:eventId` - Single event statistics
  - `/api/v1/reports/events-summary` - All events summary
  - `/api/v1/reports/payments` - Payment history (with filters: eventId, startDate, endDate)
  - `/api/v1/reports/user/:userId` - User payment report
- [x] Three export formats supported: Excel (.xlsx), CSV (.csv), PDF (.pdf)
- [x] Excel exports with ExcelJS - backend/src/reports/reports.service.ts:280-483
  - Multiple worksheets (summary + detailed transactions)
  - Formatted headers with bold text and background colors
  - Auto-fit column widths
  - Professional styling
- [x] CSV exports - backend/src/reports/reports.service.ts:485-552
  - Clean comma-separated format
  - Compatible with Excel and Google Sheets
  - Proper data escaping
- [x] PDF exports with PDFKit - backend/src/reports/reports.service.ts:554-688
  - Professional document layout
  - Sections with headers and formatting
  - Page breaks for large datasets
  - Footer with generation timestamp
- [x] Frontend API functions - frontend/src/api/reports.ts
  - exportEventStats(eventId, format)
  - exportEventsSummary(format)
  - exportPaymentHistory(options, format)
  - exportUserPayments(userId, format)
  - Automatic file download with proper naming
- [x] EventDetailStatsPage export UI - frontend/src/pages/dashboard/EventDetailStatsPage.tsx:161-208
  - Export button with dropdown menu in page header
  - Three format options (Excel, CSV, PDF) with colored icons
  - Loading state ("Exporting...") with disabled button
  - Error handling with user alerts
- [x] Full i18n support (EN + ES) - frontend/src/locales/*/dashboard.json
  - dashboard:stats.export
  - dashboard:stats.exporting
  - All export-related UI text
- [x] Routes registered in main app - backend/src/index.ts:14,69
- [x] Protected routes requiring authentication and tenant context
- [x] Comprehensive error handling (event not found, user not found, invalid format)
- [x] Report data includes:
  - Event statistics: Revenue, transactions, hourly breakdown, payment methods
  - Events summary: All events with totals and status
  - Payment history: Complete transaction list with user and event details
  - User payments: Individual user spending with event breakdown
- [x] Decimal type handling fixed - backend/src/reports/reports.service.ts
  - Number() conversion for all Prisma Decimal amounts (lines 61, 69, 124, 234)
  - Prevents "toFixed is not a function" errors in PDF/Excel/CSV generation
- [x] Export button visibility control - frontend/src/pages/dashboard/EventDetailStatsPage.tsx:162-210
  - Export dropdown only shown for COMPLETED events
  - Hidden for ACTIVE, SCHEDULED, DRAFT, and CANCELLED events
- [x] Tested and verified: All 3 formats (Excel, CSV, PDF) generate successfully
  - File downloads work automatically with proper naming
  - No TypeScript errors or runtime errors
  - Professional formatting in all output formats

### Logging Infrastructure with Pino
- [x] Backend dependencies installed - pino, pino-http, pino-pretty
- [x] Core logger configuration - backend/src/utils/logger.ts
  - Fast, low-overhead JSON-based logging
  - Configurable log levels (debug, info, warn, error, fatal) via LOG_LEVEL env var
  - Pretty-printed colorized output in development mode
  - JSON structured logs in production
  - Child logger factory with context support (createLogger function)
  - Standard error serializers for req/res/err objects
- [x] HTTP request logging middleware - backend/src/middleware/httpLogger.middleware.ts
  - Automatic logging of all HTTP requests/responses
  - Smart log levels: INFO for 2xx, WARN for 4xx, ERROR for 5xx, silent for 3xx
  - Response time measurement (duration field)
  - Request/response details (method, URL, status, headers, remote IP)
  - Sensitive header redaction (Authorization, Cookie → [REDACTED])
  - Custom properties (userId, tenantId) added to logs when available
- [x] Error response integration - backend/src/utils/errorResponse.ts
  - Automatic logging in sendError utility function
  - 4xx client errors logged as WARN level
  - 5xx server errors logged as ERROR level
  - Error details included in logs for debugging
- [x] Application lifecycle logging - backend/src/index.ts
  - Server startup logs with port, environment, and API URL
  - Graceful shutdown handlers for SIGTERM and SIGINT signals
  - Uncaught exception handler (FATAL level, exits process)
  - Unhandled promise rejection handler (FATAL level, exits process)
  - Replaced Morgan with pino-http middleware
- [x] Example controller implementation - backend/src/package/package.controller.ts
  - Created PackageController child logger
  - Replaced all console.error calls with logger.error
  - Context-aware logging (tenantId, packageId, error objects)
- [x] Comprehensive documentation - backend/LOGGING.md
  - Overview and features
  - Configuration (environment variables, log levels)
  - Usage examples (basic logging, controllers, HTTP, errors)
  - Output formats (development pretty vs production JSON)
  - Best practices (DO's and DON'Ts)
  - Sensitive data handling guidelines
  - Production monitoring integration (Datadog, Elasticsearch, CloudWatch, etc.)
  - Performance characteristics (~10x faster than Winston)
  - Troubleshooting guide
- [x] Production-ready features
  - Asynchronous logging (doesn't block event loop)
  - Small footprint (~30KB)
  - Automatic timestamp with ISO format
  - Environment and app name in all logs
  - Stack trace serialization for errors
  - Ideal for high-traffic production servers

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
- **Backend**: Node.js 20+, Express, TypeScript, Prisma, PostgreSQL, bcryptjs, JWT, Zod, Pino (logging)
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

