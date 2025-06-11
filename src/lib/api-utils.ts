import { NextResponse } from 'next/server';

export function handleApiError(
  error: unknown,
  operation: string
): NextResponse {
  console.error(`Error in ${operation}:`, error);
  return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
}

export function createErrorResponse(
  message: string,
  status: number
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
