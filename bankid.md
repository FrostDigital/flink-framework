# BankID Plugin Implementation Plan

## Overview

Create a Flink plugin for Swedish BankID authentication and document signing using the `bankid` npm package. The plugin will
provide secure endpoints for initiating authentication/signing and collecting session status, with seamless integration to Flink's auth system for automatic token generation and user management.

## Package Structure

-   **Package**: `packages/bankid-plugin/`
-   **Dependencies**: `bankid` npm package, Express types
-   **Environment**: PFX certificate as base64 string in env variables

## Core Components

### 1. Plugin Configuration

-   Environment variables: `BANKID_PFX_BASE64`, `BANKID_PASSPHRASE`, `BANKID_PRODUCTION`
-   Plugin context with BankID client instance
-   Session storage repository for tracking order references
-   Integration with Flink auth plugin for token generation
-   User mapping configuration for BankID personal number to user accounts

### 2. API Endpoints

-   `POST /bankid/auth` - Initiate authentication (returns orderRef + autoStartToken)
-   `GET /bankid/auth/:orderRef` - Check authentication status (returns JWT tokens on completion)
-   `POST /bankid/sign` - Initiate document signing (returns orderRef + autoStartToken)
-   `GET /bankid/sign/:orderRef` - Check signing status (with optional token refresh)
-   `DELETE /bankid/session/:orderRef` - Cancel ongoing session

### 3. Data Models

-   BankID session tracking (orderRef, type, status, createdAt, userInfo, userId)
-   Request/response schemas for all endpoints
-   Error handling schemas
-   JWT token response schemas with access/refresh tokens
-   User mapping schemas for BankID personal number associations

### 4. Security Features

-   IP address validation and logging
-   Session timeout handling
-   Proper error responses without sensitive data exposure
-   Optional authentication requirements for endpoints

## Technical Details

-   Follow Flink plugin architecture patterns
-   Use FlinkRepo for session persistence
-   Implement proper TypeScript typing throughout
-   Include comprehensive error handling
-   Support both test and production BankID environments
-   Integrate with FlinkAuthPlugin interface for token generation
-   Support configurable user lookup strategies (by personal number, email, username)

## Auth Plugin Integration

### Plugin Options Interface
```typescript
interface BankIdPluginOptions {
  // BankID configuration
  pfxBase64: string;
  passphrase: string;
  production?: boolean;
  
  // Auth integration
  authPlugin: FlinkAuthPlugin;
  getUserByPersonalNumber: (personalNumber: string) => Promise<FlinkAuthUser | null>;
  createUserFromBankId?: (bankIdUser: BankIdUserInfo) => Promise<FlinkAuthUser>;
  
  // Callback hooks
  onBeforeAuth?: (personalNumber: string, ip: string) => Promise<void>;
  onAfterSuccessfulAuth?: (user: FlinkAuthUser, bankIdInfo: BankIdUserInfo) => Promise<void>;
  onBeforeSign?: (user: FlinkAuthUser, document: any) => Promise<void>;
  onAfterSuccessfulSign?: (user: FlinkAuthUser, signature: BankIdSignature) => Promise<void>;
  onAuthFailure?: (personalNumber: string, reason: string) => Promise<void>;
  onSignFailure?: (user: FlinkAuthUser, reason: string) => Promise<void>;
}
```

### Token Generation Flow
1. **Authentication Success**: Automatically generates JWT tokens using the configured auth plugin
2. **User Mapping**: Maps BankID personal number to existing users or creates new users
3. **Role Assignment**: Assigns default roles or maps from BankID attributes
4. **Token Response**: Returns access token, refresh token, and user information

### Auth Status Response
```typescript
interface BankIdAuthStatusResponse {
  status: 'pending' | 'complete' | 'failed' | 'cancelled';
  orderRef: string;
  // On completion:
  tokens?: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  };
  user?: FlinkAuthUser;
  // On pending:
  hintCode?: string;
  // On failure:
  errorCode?: string;
}
```

## Callback Hooks

### Pre-Authentication Hook
- **When**: Before initiating BankID authentication
- **Purpose**: Validate user eligibility, rate limiting, IP restrictions
- **Parameters**: `personalNumber`, `ip`
- **Can throw**: Error to prevent authentication

### Post-Authentication Hook  
- **When**: After successful BankID authentication, before token generation
- **Purpose**: User profile updates, audit logging, welcome notifications
- **Parameters**: `user`, `bankIdInfo`
- **Note**: Tokens are generated after this hook completes

### Pre-Signing Hook
- **When**: Before initiating BankID document signing
- **Purpose**: Document validation, user authorization checks
- **Parameters**: `user`, `document`
- **Can throw**: Error to prevent signing

### Post-Signing Hook
- **When**: After successful document signing
- **Purpose**: Document storage, notifications, audit trails
- **Parameters**: `user`, `signature`

### Error Hooks
- **onAuthFailure**: Handle authentication failures (logging, alerts)
- **onSignFailure**: Handle signing failures (cleanup, notifications)

## Implementation Tasks

1. Create package.json for bankid-plugin with bankid dependency
2. Implement main plugin file with BankID client initialization
3. Create BankID context interface for dependency injection with auth plugin reference
4. Implement authentication initiation handler (POST /bankid/auth) with pre-auth hooks
5. Implement authentication status collection handler (GET /bankid/auth/:orderRef) with token generation
6. Implement signing initiation handler (POST /bankid/sign) with pre-sign hooks
7. Implement signing status collection handler (GET /bankid/sign/:orderRef) with post-sign hooks
8. Implement session cancellation handler (DELETE /bankid/session/:orderRef)
9. Create TypeScript schemas for all request/response types including token schemas
10. Create session storage repository for tracking BankID sessions with user associations
11. Add configuration validation and environment variable handling
12. Create TypeScript configuration files
13. Implement user lookup and creation strategies for BankID personal numbers
14. Add comprehensive callback hook system with error handling
15. Create integration tests with mock auth plugin
