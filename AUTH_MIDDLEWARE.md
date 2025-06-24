# Authentication Middleware

This document explains the authentication middleware used in the AI Flashcards application.

## Overview

The authentication middleware provides a simple way to handle user authentication in API routes. It uses Supabase for authentication and provides helper functions to verify user identity.

## Files

- `src/lib/auth-middleware.ts` - Main middleware functions
- `src/lib/api-utils.ts` - API utility functions

## Usage

### Basic Authentication

```typescript
import { withAuth, requireAuth } from '@/lib/auth-middleware';
import { createErrorResponse, createSuccessResponse } from '@/lib/api-utils';

export async function GET(request: NextRequest) {
  try {
    const authenticatedRequest = await withAuth(request);
    const user = requireAuth(authenticatedRequest);

    // User is now authenticated
    return createSuccessResponse({ user: user.id });
  } catch (error) {
    if (error instanceof Error && error.message === 'Authentication required') {
      return createErrorResponse('Authentication required', 401);
    }
    console.error('Error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}
```

### Functions

- `withAuth(request)` - Adds user to request if authenticated
- `requireAuth(request)` - Throws error if user not authenticated
- `getAuthUser(request)` - Returns user object or null

### Error Handling

The middleware uses simple error responses:

- `createErrorResponse(message, status)` - Creates error response
- `createSuccessResponse(data, status)` - Creates success response

## Client-Side Usage

For client-side API calls, use the `authenticatedFetch` function:

```typescript
import { authenticatedFetch } from '@/lib/api-utils';

const data = await authenticatedFetch('/api/decks');
```

## How It Works

### 1. Server-Side Authentication

- Uses `supabaseServer` (service role key) to bypass RLS
- Middleware extracts user from JWT token in Authorization header
- Manual filtering by `user_id` instead of relying on RLS policies

### 2. Client-Side API Calls

- Use `authenticatedFetch()` helper function
- Automatically includes auth token in requests
- Handles errors consistently

## Benefits

✅ **No RLS Headaches** - Bypasses all RLS policies  
✅ **Simple Authentication** - One middleware handles everything  
✅ **Consistent Error Handling** - Standardized error responses  
✅ **Type Safety** - Full TypeScript support  
✅ **Easy to Use** - Simple API for both client and server

## Security

- Uses service role key for server operations
- Manual filtering ensures users only access their own data
- JWT tokens validated on every request
- No RLS complexity to debug

## Migration from RLS

If you want to re-enable RLS later:

1. Remove the middleware usage
2. Switch back to regular `supabase` client
3. Re-enable RLS policies in database
4. Update API routes to use `createSupabaseServerClient(request)`
