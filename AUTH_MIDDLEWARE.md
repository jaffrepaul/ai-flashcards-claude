# Authentication Middleware

This project uses a simplified authentication middleware approach to avoid RLS (Row Level Security) issues with Supabase.

## How It Works

### 1. Server-Side Authentication

- Uses `supabaseServer` (service role key) to bypass RLS
- Middleware extracts user from JWT token in Authorization header
- Manual filtering by `user_id` instead of relying on RLS policies

### 2. Client-Side API Calls

- Use `authenticatedFetch()` helper function
- Automatically includes auth token in requests
- Handles errors consistently

## Usage

### In API Routes

```typescript
import { withAuth, requireAuth } from '@/lib/auth-middleware';
import { supabaseServer } from '@/lib/supabase-admin';

export async function GET(request: NextRequest) {
  try {
    const authenticatedRequest = await withAuth(request);
    const user = requireAuth(authenticatedRequest);

    // Now you can use supabaseServer without RLS issues
    const { data, error } = await supabaseServer
      .from('decks')
      .select('*')
      .eq('user_id', user.id); // Manual filtering

    // ... rest of your code
  } catch (error) {
    if (error instanceof Error && error.message === 'Authentication required') {
      return createErrorResponse('Authentication required', 401);
    }
    return handleApiError(error, 'GET /api/decks');
  }
}
```

### In Client Components

```typescript
import { authenticatedFetch } from '@/lib/api-utils';

// Simple authenticated API call
const data = await authenticatedFetch('/api/decks');

// With POST data
const result = await authenticatedFetch('/api/decks', {
  method: 'POST',
  body: JSON.stringify({ title: 'My Deck' }),
});
```

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
