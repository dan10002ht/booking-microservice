/**
 * Services Index
 * Centralized exports for all services
 */

// Internal Services (Business Logic)
export * as internal from './internal/index.js';

// External Services (gRPC Clients)
export * as external from './external/index.js';

// Integration Services (Business Flows)
export * as integration from './integration/index.js';

// Convenience exports for backward compatibility
export * as authService from './internal/authService.js';
export * as userManagementService from './internal/userManagementService.js';
export * as adminService from './internal/adminService.js';
export * as organizationManagementService from './internal/organizationManagementService.js';
export * as oauthService from './internal/oauthService.js';
export * as emailVerificationService from './internal/emailVerificationService.js';
export * as permissionService from './internal/permissionService.js';
export * as twoFactorService from './internal/twoFactorService.js';

export * as deviceService from './external/deviceService.js';
export * as securityService from './external/securityService.js';

export * as integrationService from './integration/integrationService.js';
