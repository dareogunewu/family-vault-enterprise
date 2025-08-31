import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes in milliseconds

export async function middleware(req: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: req.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          req.cookies.set({
            name,
            value,
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: req.headers,
            },
          });
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: any) {
          req.cookies.set({
            name,
            value: '',
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: req.headers,
            },
          });
          response.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );

  // Public routes that don't require authentication
  const publicRoutes = [
    '/',
    '/auth/login',
    '/auth/register', 
    '/auth/callback',
    '/auth/verify',
    '/login',
    '/register'
  ];

  const isPublicRoute = publicRoutes.some(route => req.nextUrl.pathname.startsWith(route));

  if (isPublicRoute) {
    return response;
  }

  try {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      const redirectUrl = new URL('/auth/login', req.url);
      redirectUrl.searchParams.set('message', 'Please log in to access this page');
      return NextResponse.redirect(redirectUrl);
    }

    // Check if session has expired based on our timeout policy
    // Note: Supabase session object may not have created_at, so we'll use a cookie-based approach
    const sessionCookie = req.cookies.get('session_start_time');
    const now = Date.now();
    
    let sessionStartTime = now;
    if (sessionCookie?.value) {
      sessionStartTime = parseInt(sessionCookie.value);
    } else {
      // Set session start time cookie if it doesn't exist
      response.cookies.set('session_start_time', now.toString(), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: SESSION_TIMEOUT_MS / 1000
      });
    }
    
    const sessionAge = now - sessionStartTime;

    if (sessionAge > SESSION_TIMEOUT_MS) {
      // Session has expired, sign out the user
      await supabase.auth.signOut();
      
      const redirectUrl = new URL('/auth/login', req.url);
      redirectUrl.searchParams.set('message', 'Your session has expired. Please log in again.');
      redirectUrl.searchParams.set('timeout', 'true');
      return NextResponse.redirect(redirectUrl);
    }

    // Check if we need to refresh the session (refresh when 50% of timeout has passed)
    const refreshThreshold = SESSION_TIMEOUT_MS * 0.5;
    if (sessionAge > refreshThreshold) {
      try {
        await supabase.auth.refreshSession();
      } catch (error) {
        console.error('Failed to refresh session:', error);
        // If refresh fails, redirect to login
        const redirectUrl = new URL('/auth/login', req.url);
        redirectUrl.searchParams.set('message', 'Session expired. Please log in again.');
        return NextResponse.redirect(redirectUrl);
      }
    }

  } catch (error) {
    console.error('Middleware auth error:', error);
    const redirectUrl = new URL('/auth/login', req.url);
    redirectUrl.searchParams.set('message', 'Authentication error. Please log in again.');
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)  
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};