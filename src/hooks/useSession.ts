'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';

const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
const SESSION_CHECK_INTERVAL = 60 * 1000; // Check every minute
const IDLE_WARNING_MS = 25 * 60 * 1000; // Warn at 25 minutes (5 min before timeout)

export interface SessionState {
  isAuthenticated: boolean;
  isLoading: boolean;
  timeUntilExpiry: number | null;
  showIdleWarning: boolean;
}

export const useSession = () => {
  const [sessionState, setSessionState] = useState<SessionState>({
    isAuthenticated: false,
    isLoading: true,
    timeUntilExpiry: null,
    showIdleWarning: false,
  });

  const router = useRouter();

  useEffect(() => {
    let sessionCheckInterval: NodeJS.Timeout;
    let sessionStartTime = Date.now();

    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error || !session) {
          setSessionState({
            isAuthenticated: false,
            isLoading: false,
            timeUntilExpiry: null,
            showIdleWarning: false,
          });
          return;
        }

        // Update session start time when we get a fresh session
        // Use cookie-based approach since session object may not have created_at
        const sessionCookie = document.cookie
          .split('; ')
          .find(row => row.startsWith('session_start_time='));
        
        if (sessionCookie) {
          sessionStartTime = parseInt(sessionCookie.split('=')[1]);
        }

        const now = Date.now();
        const sessionAge = now - sessionStartTime;
        const timeUntilExpiry = Math.max(0, SESSION_TIMEOUT_MS - sessionAge);
        
        const showIdleWarning = sessionAge >= IDLE_WARNING_MS && timeUntilExpiry > 0;

        setSessionState({
          isAuthenticated: true,
          isLoading: false,
          timeUntilExpiry,
          showIdleWarning,
        });

        // If session has expired locally, sign out
        if (timeUntilExpiry <= 0) {
          await supabase.auth.signOut();
          router.push('/auth/login?message=Your session has expired. Please log in again.&timeout=true');
        }
      } catch (error) {
        console.error('Session check error:', error);
        setSessionState({
          isAuthenticated: false,
          isLoading: false,
          timeUntilExpiry: null,
          showIdleWarning: false,
        });
      }
    };

    const extendSession = async () => {
      try {
        const { error } = await supabase.auth.refreshSession();
        if (!error) {
          sessionStartTime = Date.now();
          setSessionState(prev => ({
            ...prev,
            showIdleWarning: false,
            timeUntilExpiry: SESSION_TIMEOUT_MS,
          }));
        }
      } catch (error) {
        console.error('Failed to extend session:', error);
      }
    };

    // Initial session check
    checkSession();

    // Set up periodic session checking
    sessionCheckInterval = setInterval(checkSession, SESSION_CHECK_INTERVAL);

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        sessionStartTime = Date.now();
      } else if (event === 'SIGNED_OUT') {
        setSessionState({
          isAuthenticated: false,
          isLoading: false,
          timeUntilExpiry: null,
          showIdleWarning: false,
        });
      }
    });

    // Reset session timer on user activity
    const resetSessionTimer = () => {
      sessionStartTime = Date.now();
      setSessionState(prev => ({
        ...prev,
        showIdleWarning: false,
        timeUntilExpiry: SESSION_TIMEOUT_MS,
      }));
    };

    // Activity event listeners
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    let activityTimeout: NodeJS.Timeout;

    const handleActivity = () => {
      clearTimeout(activityTimeout);
      activityTimeout = setTimeout(resetSessionTimer, 1000); // Debounce activity
    };

    activityEvents.forEach(event => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    return () => {
      clearInterval(sessionCheckInterval);
      clearTimeout(activityTimeout);
      subscription.unsubscribe();
      activityEvents.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
    };
  }, [router]);

  const extendSession = async () => {
    try {
      const { error } = await supabase.auth.refreshSession();
      if (!error) {
        setSessionState(prev => ({
          ...prev,
          showIdleWarning: false,
          timeUntilExpiry: SESSION_TIMEOUT_MS,
        }));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to extend session:', error);
      return false;
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    router.push('/auth/login');
  };

  return {
    ...sessionState,
    extendSession,
    signOut,
  };
};