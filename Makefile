.PHONY: help dev-backend dev-frontend dev db-push db-migrate db-reset db-studio \
        create-superadmin create-tenant list-tenants activate-tenant deactivate-tenant \
        test-user

# Default target: show help
.DEFAULT_GOAL := help

# Colors for output
BLUE := \033[0;34m
GREEN := \033[0;32m
YELLOW := \033[0;33m
RED := \033[0;31m
NC := \033[0m # No Color

##@ General

help: ## Show this help message
	@echo "$(BLUE)Smart Cashless Hub - Makefile Commands$(NC)"
	@echo ""
	@awk 'BEGIN {FS = ":.*##"; printf "\nUsage:\n  make $(GREEN)<target>$(NC)\n"} /^[a-zA-Z_-]+:.*?##/ { printf "  $(GREEN)%-25s$(NC) %s\n", $$1, $$2 } /^##@/ { printf "\n$(BLUE)%s$(NC)\n", substr($$0, 5) } ' $(MAKEFILE_LIST)

##@ Development

dev-backend: ## Start backend development server
	@echo "$(GREEN)Starting backend...$(NC)"
	cd backend && npm run dev

dev-frontend: ## Start frontend development server
	@echo "$(GREEN)Starting frontend...$(NC)"
	cd frontend && npm run dev

dev: ## Start both backend and frontend (requires tmux or run in separate terminals)
	@echo "$(YELLOW)Please run 'make dev-backend' and 'make dev-frontend' in separate terminals$(NC)"

##@ Database

db-push: ## Push schema changes to database (development)
	@echo "$(GREEN)Pushing schema to database...$(NC)"
	cd backend && npx prisma db push

db-migrate: ## Create and apply database migration
	@echo "$(GREEN)Creating migration...$(NC)"
	@read -p "Migration name: " name; \
	cd backend && npx prisma migrate dev --name "$$name"

db-reset: ## Reset database (WARNING: deletes all data)
	@echo "$(RED)WARNING: This will delete all data!$(NC)"
	@read -p "Are you sure? (yes/no): " confirm; \
	if [ "$$confirm" = "yes" ]; then \
		cd backend && npx prisma migrate reset --force; \
		echo "$(GREEN)Database reset complete$(NC)"; \
	else \
		echo "$(YELLOW)Operation cancelled$(NC)"; \
	fi

db-studio: ## Open Prisma Studio to browse database
	@echo "$(GREEN)Opening Prisma Studio...$(NC)"
	cd backend && npx prisma studio

##@ Admin - User Management

create-superadmin: ## Create a SUPERADMIN user (EMAIL, PASSWORD, FIRST_NAME, LAST_NAME)
	@echo "$(GREEN)Creating SUPERADMIN...$(NC)"
	@if [ -z "$(EMAIL)" ]; then \
		echo "$(YELLOW)No EMAIL provided, using default: admin@smartcashless.com$(NC)"; \
	fi
	cd backend && npx tsx scripts/create-superadmin.ts

# Example: make create-superadmin EMAIL=admin@example.com PASSWORD=secure123 FIRST_NAME=John LAST_NAME=Doe

##@ Admin - Tenant Management

create-tenant: ## Create a new tenant with admin user (NAME, SLUG, EMAIL, PASSWORD)
	@echo "$(GREEN)Creating tenant...$(NC)"
	@if [ -z "$(NAME)" ] || [ -z "$(SLUG)" ] || [ -z "$(EMAIL)" ]; then \
		echo "$(RED)ERROR: Required parameters missing!$(NC)"; \
		echo "Usage: make create-tenant NAME=\"Club Name\" SLUG=club-name EMAIL=admin@club.com PASSWORD=secure123"; \
		exit 1; \
	fi
	cd backend && npx tsx scripts/create-tenant.ts

# Example: make create-tenant NAME="Beso Club" SLUG=beso-club EMAIL=admin@besoclub.com PASSWORD=secure123

list-tenants: ## List all tenants with details
	@echo "$(GREEN)Listing all tenants...$(NC)"
	cd backend && npx tsx scripts/list-tenants.ts

activate-tenant: ## Activate a tenant (SLUG)
	@echo "$(GREEN)Activating tenant...$(NC)"
	@if [ -z "$(SLUG)" ]; then \
		echo "$(RED)ERROR: SLUG parameter required!$(NC)"; \
		echo "Usage: make activate-tenant SLUG=club-name"; \
		exit 1; \
	fi
	cd backend && ACTION=activate npx tsx scripts/toggle-tenant.ts

# Example: make activate-tenant SLUG=beso-club

deactivate-tenant: ## Deactivate a tenant (SLUG)
	@echo "$(YELLOW)Deactivating tenant...$(NC)"
	@if [ -z "$(SLUG)" ]; then \
		echo "$(RED)ERROR: SLUG parameter required!$(NC)"; \
		echo "Usage: make deactivate-tenant SLUG=club-name"; \
		exit 1; \
	fi
	cd backend && ACTION=deactivate npx tsx scripts/toggle-tenant.ts

# Example: make deactivate-tenant SLUG=beso-club

##@ Testing

test-user: ## Create test user and tenant for development
	@echo "$(GREEN)Creating test user...$(NC)"
	cd backend && npx tsx scripts/create-test-user.ts

##@ Installation

install: ## Install all dependencies
	@echo "$(GREEN)Installing backend dependencies...$(NC)"
	cd backend && npm install
	@echo "$(GREEN)Installing frontend dependencies...$(NC)"
	cd frontend && npm install
	@echo "$(GREEN)All dependencies installed!$(NC)"

##@ Quick Start Examples

example-superadmin: ## Show example of creating a superadmin
	@echo "$(BLUE)Example: Create SUPERADMIN$(NC)"
	@echo "  make create-superadmin EMAIL=admin@example.com PASSWORD=MySecure123 FIRST_NAME=John LAST_NAME=Doe"

example-tenant: ## Show example of creating a tenant
	@echo "$(BLUE)Example: Create Tenant$(NC)"
	@echo "  make create-tenant NAME=\"Beso Club\" SLUG=beso-club EMAIL=admin@besoclub.com PASSWORD=BesoPwd123"

example-manage: ## Show example of managing tenants
	@echo "$(BLUE)Example: Manage Tenants$(NC)"
	@echo "  make list-tenants"
	@echo "  make deactivate-tenant SLUG=beso-club"
	@echo "  make activate-tenant SLUG=beso-club"