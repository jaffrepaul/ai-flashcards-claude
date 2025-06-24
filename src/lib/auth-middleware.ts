import { NextRequest } from 'next/server';
import { User } from '@supabase/supabase-js';
import { supabaseServer } from '@/lib/supabase-admin';

export interface AuthenticatedRequest extends NextRequest {
  user?: User;
}

export async function getAuthUser(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  const {
    data: { user },
    error,
  } = await supabaseServer.auth.getUser(token);

  if (error || !user) {
    return null;
  }

  return user;
}

export async function withAuth(
  request: NextRequest
): Promise<AuthenticatedRequest> {
  const user = await getAuthUser(request);
  const authenticatedRequest = request as AuthenticatedRequest;
  authenticatedRequest.user = user || undefined;
  return authenticatedRequest;
}

export function requireAuth(request: AuthenticatedRequest) {
  if (!request.user) {
    throw new Error('Authentication required');
  }
  return request.user;
}
