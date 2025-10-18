// Extend Express Request interface to include auth properties

import { UserRole } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      userEmail?: string;
      globalRole?: UserRole;
      tenantId?: string;
      tenantRole?: UserRole;
    }
  }
}