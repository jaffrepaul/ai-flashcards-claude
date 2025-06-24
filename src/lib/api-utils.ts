import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export function handleApiError(
  error: unknown,
  operation: string
): NextResponse {
  console.error(`Error in ${operation}:`, error);
  const message =
    error instanceof Error ? error.message : 'An unexpected error occurred';
  return NextResponse.json({ error: message }, { status: 500 });
}

export function createErrorResponse(
  message: string,
  status: number = 500
): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

export function createSuccessResponse(
  data: any,
  status: number = 200
): NextResponse {
  return NextResponse.json(data, { status });
}

export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  operationName: string
): Promise<T | NextResponse> {
  try {
    return await operation();
  } catch (error) {
    return handleApiError(error, operationName);
  }
}

// Helper function for making authenticated API calls from client
export async function authenticatedFetch(
  url: string,
  options: RequestInit = {}
) {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const accessToken = session?.access_token;

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response
      .json()
      .catch(() => ({ error: 'Unknown error' }));
    throw new Error(
      errorData.error || `HTTP ${response.status}: ${response.statusText}`
    );
  }

  return response.json();
}
