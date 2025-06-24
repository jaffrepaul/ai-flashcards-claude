import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { createServerActionClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const createSupabaseServerClient = () => {
  const cookieStore = cookies();
  return createServerActionClient({ cookies: () => cookieStore });
};
