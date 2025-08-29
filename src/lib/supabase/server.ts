// Server-side Supabase client for Family Vault Enterprise
// Used in API routes and server components

import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import type { Database } from './client';

// Server-side client for API routes
export const createServerSupabaseClient = () => {
  const cookieStore = cookies();
  return createRouteHandlerClient<Database>({ cookies: () => cookieStore });
};

// Server-side client for server components
export const createServerComponentSupabaseClient = () => {
  const cookieStore = cookies();
  return createServerComponentClient<Database>({ cookies: () => cookieStore });
};