# Admin Scripts Documentation

Administration scripts for managing the Smart Cashless Hub platform.

## Requirements

- Node.js v18+
- Configured PostgreSQL database
- Environment variables configured (`.env`)

## Quick Commands

All commands are executed from the project root using `make`.

### View all available commands

```bash
make help
```

---

## 🔐 User Management

### Create SUPERADMIN

Creates a user with SUPERADMIN role who can manage all tenants.

```bash
# With default values
make create-superadmin

# With custom values
make create-superadmin \
  EMAIL=admin@example.com \
  PASSWORD=MySecure123 \
  FIRST_NAME=John \
  LAST_NAME=Doe
```

**Default values:**
- EMAIL: `admin@smartcashless.com`
- PASSWORD: `admin123`
- FIRST_NAME: `Super`
- LAST_NAME: `Admin`

⚠️ **IMPORTANT:** Change the password after first login.

---

## 🏢 Tenant Management

### Create a New Tenant

Creates a tenant (club/organization) along with its admin user.

```bash
make create-tenant \
  NAME="Beso Club" \
  SLUG=beso-club \
  EMAIL=admin@besoclub.com \
  PASSWORD=BesoPwd123
```

**Parameters:**
- `NAME` (required): Tenant name
- `SLUG` (required): Unique URL-friendly identifier
- `EMAIL` (required): Tenant admin email
- `PASSWORD` (optional): Password (default: `changeme123`)
- `DESCRIPTION` (optional): Tenant description
- `CONTACT_EMAIL` (optional): Contact email
- `CONTACT_PHONE` (optional): Contact phone

**Examples:**

```bash
# Basic tenant
make create-tenant \
  NAME="Night Club" \
  SLUG=night-club \
  EMAIL=admin@nightclub.com

# Tenant with full information
make create-tenant \
  NAME="Music Festival 2025" \
  SLUG=music-festival-2025 \
  EMAIL=admin@musicfestival.com \
  PASSWORD=Festival2025! \
  DESCRIPTION="Electronic music festival" \
  CONTACT_EMAIL=contact@musicfestival.com \
  CONTACT_PHONE="+34 600 123 456"
```

### List All Tenants

Shows all tenants with their details, users, and events.

```bash
make list-tenants
```

**Information displayed:**
- Basic data (name, slug, status)
- Number of users and events
- User list with their roles
- Latest created events
- Creation date

### Deactivate a Tenant

Temporarily deactivates a tenant. Users will not be able to log in.

```bash
make deactivate-tenant SLUG=beso-club
```

⚠️ Tenant users will not be able to access while deactivated.

### Activate a Tenant

Reactivates a previously deactivated tenant.

```bash
make activate-tenant SLUG=beso-club
```

---

## 🧪 Testing

### Create Test User

Creates a test user and tenant for development.

```bash
make test-user
```

**Created credentials:**
- Email: `test@test.com`
- Password: `password123`
- Tenant: `test-club`

---

## 🗄️ Database Management

### Open Prisma Studio

Visual interface to explore the database.

```bash
make db-studio
```

### Apply Schema Changes

Push schema changes without creating migration (development).

```bash
make db-push
```

### Create Migration

Creates a new migration for schema changes.

```bash
make db-migrate
# Will prompt for migration name
```

### Reset Database

⚠️ **DANGER:** Deletes all data and recreates the schema.

```bash
make db-reset
# Requires confirmation
```

---

## 📋 Typical Workflow

### Initial Setup

1. **Install dependencies**
   ```bash
   make install
   ```

2. **Configure database**
   ```bash
   make db-push
   ```

3. **Create SUPERADMIN**
   ```bash
   make create-superadmin \
     EMAIL=admin@mycompany.com \
     PASSWORD=SecurePassword123
   ```

### Create a New Client

1. **Create the tenant**
   ```bash
   make create-tenant \
     NAME="New Club" \
     SLUG=new-club \
     EMAIL=admin@newclub.com \
     PASSWORD=ClubPwd123
   ```

2. **Verify creation**
   ```bash
   make list-tenants
   ```

3. **Send credentials to client**
   - URL: `http://yourdomain.com/new-club`
   - Email: `admin@newclub.com`
   - Password: `ClubPwd123`

### Incident Management

**Client with technical issues:**
```bash
make deactivate-tenant SLUG=problematic-club
```

**Client resolved their debts:**
```bash
make activate-tenant SLUG=problematic-club
```

---

## 🔒 Security

### Best Practices

1. **Passwords:**
   - Use strong passwords for SUPERADMIN
   - Generate unique passwords for each tenant
   - Instruct clients to change their password on first login

2. **Script Access:**
   - Only run these scripts from secure machines
   - Do not expose these endpoints in production
   - Keep logs of who executes what command

3. **Backups:**
   - Backup before running `db-reset`
   - Maintain production data copies

### Dangerous Commands

These commands can cause data loss:

- `make db-reset` - Deletes ALL data
- `make deactivate-tenant` - Blocks tenant access

Always double-check before executing them.

---

## 🐛 Troubleshooting

### Error: "Tenant slug already exists"

The slug must be unique. Choose another or delete the existing tenant.

```bash
make list-tenants  # View all slugs
```

### Error: "Email already exists"

The email is already registered. Use another email or update the existing user from Prisma Studio.

```bash
make db-studio  # Explore existing users
```

### Error: "DATABASE_URL not found"

Verify that the `.env` file exists in `/backend/` and contains `DATABASE_URL`.

---

## 📞 Support

If you encounter issues:

1. Review script logs
2. Verify database connection
3. Check current state in Prisma Studio
4. Contact the development team

---

## 🚀 Development Commands

```bash
# View help
make help

# Start backend
make dev-backend

# Start frontend
make dev-frontend

# View examples
make example-superadmin
make example-tenant
make example-manage
```