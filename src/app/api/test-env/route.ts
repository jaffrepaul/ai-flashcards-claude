import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const envCheck = {
    hasOpenAIKey: !!process.env.OPENAI_API_KEY,
    openaiKeyLength: process.env.OPENAI_API_KEY?.length || 0,
    hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasSupabaseAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    hasServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    serviceRoleKeyLength: process.env.SUPABASE_SERVICE_ROLE_KEY?.length || 0,
  };

  return NextResponse.json({
    message: 'Environment check',
    env: envCheck,
    openaiKeyPreview: process.env.OPENAI_API_KEY?.substring(0, 20) + '...',
    serviceRoleKeyPreview:
      process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 20) + '...',
  });
}
