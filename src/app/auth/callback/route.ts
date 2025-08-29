// Supabase auth callback handler
// Handles OAuth redirects and email confirmations

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    const supabase = createServerSupabaseClient();
    
    try {
      await supabase.auth.exchangeCodeForSession(code);
    } catch (error) {
      console.error('Auth callback error:', error);
      return NextResponse.redirect(new URL('/auth/login?error=callback_error', requestUrl.origin));
    }
  }

  // Redirect to home page or intended destination
  return NextResponse.redirect(new URL('/', requestUrl.origin));
}