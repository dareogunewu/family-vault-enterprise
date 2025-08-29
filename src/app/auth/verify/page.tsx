'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Loader, Mail } from 'lucide-react';

export default function VerifyPage() {
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [message, setMessage] = useState('Verifying your email...');
  const router = useRouter();

  useEffect(() => {
    const handleEmailVerification = async () => {
      try {
        // Check if user is already verified
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user?.email_confirmed_at) {
          setStatus('success');
          setMessage('Email verified successfully!');
          // Redirect to login after 2 seconds
          setTimeout(() => {
            router.push('/auth/login?message=Email verified! You can now sign in.');
          }, 2000);
        } else {
          setStatus('error');
          setMessage('Email verification failed or still pending.');
        }
      } catch (error) {
        setStatus('error');
        setMessage('An error occurred during verification.');
        console.error('Verification error:', error);
      }
    };

    handleEmailVerification();
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            {status === 'verifying' && <Loader className="h-12 w-12 text-blue-600 animate-spin" />}
            {status === 'success' && <CheckCircle className="h-12 w-12 text-green-600" />}
            {status === 'error' && <XCircle className="h-12 w-12 text-red-600" />}
          </div>
          <CardTitle>Email Verification</CardTitle>
          <CardDescription>
            {status === 'verifying' && 'Please wait while we verify your email address...'}
            {status === 'success' && 'Your email has been verified successfully!'}
            {status === 'error' && 'There was an issue verifying your email.'}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="text-center space-y-4">
          <p className="text-sm text-gray-600">{message}</p>
          
          {status === 'success' && (
            <div className="space-y-2">
              <p className="text-sm text-green-600 font-medium">
                Redirecting to login...
              </p>
            </div>
          )}
          
          {status === 'error' && (
            <div className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <Mail className="h-5 w-5 text-yellow-600" />
                  <p className="text-sm text-yellow-800">
                    Please check your email and click the verification link.
                  </p>
                </div>
              </div>
              
              <div className="space-x-2">
                <Button
                  onClick={() => router.push('/auth/login')}
                  variant="outline"
                >
                  Go to Login
                </Button>
                <Button
                  onClick={() => router.push('/auth/register')}
                  variant="outline"
                >
                  Register Again
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}