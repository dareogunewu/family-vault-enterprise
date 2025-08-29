'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, AlertCircle, Database } from 'lucide-react';

interface DebugInfo {
  supabaseUrl: string | undefined;
  supabaseKey: string | undefined;
  connectionStatus: 'checking' | 'connected' | 'error';
  authStatus: 'checking' | 'configured' | 'error';
  databaseStatus: 'checking' | 'connected' | 'error';
  errorMessage?: string;
  currentUser?: any;
}

export default function SupabaseDebugPage() {
  const [debug, setDebug] = useState<DebugInfo>({
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    connectionStatus: 'checking',
    authStatus: 'checking',
    databaseStatus: 'checking',
  });

  useEffect(() => {
    const runDiagnostics = async () => {
      try {
        // Test 1: Check environment variables
        if (!debug.supabaseUrl || !debug.supabaseKey) {
          setDebug(prev => ({
            ...prev,
            connectionStatus: 'error',
            errorMessage: 'Missing environment variables'
          }));
          return;
        }

        // Test 2: Check connection
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          setDebug(prev => ({
            ...prev,
            connectionStatus: 'error',
            authStatus: 'error',
            errorMessage: `Auth error: ${error.message}`
          }));
          return;
        }

        setDebug(prev => ({
          ...prev,
          connectionStatus: 'connected',
          authStatus: 'configured',
          currentUser: data.session?.user || null
        }));

        // Test 3: Check database connection
        try {
          const { data: dbData, error: dbError } = await supabase
            .from('users')
            .select('count')
            .limit(1);

          if (dbError) {
            setDebug(prev => ({
              ...prev,
              databaseStatus: 'error',
              errorMessage: `Database error: ${dbError.message}`
            }));
          } else {
            setDebug(prev => ({
              ...prev,
              databaseStatus: 'connected'
            }));
          }
        } catch (dbError) {
          setDebug(prev => ({
            ...prev,
            databaseStatus: 'error',
            errorMessage: `Database connection failed: ${dbError}`
          }));
        }

      } catch (error) {
        setDebug(prev => ({
          ...prev,
          connectionStatus: 'error',
          authStatus: 'error',
          databaseStatus: 'error',
          errorMessage: `General error: ${error}`
        }));
      }
    };

    runDiagnostics();
  }, [debug.supabaseUrl, debug.supabaseKey]);

  const testRegistration = async () => {
    try {
      const testEmail = `test-${Date.now()}@example.com`;
      const testPassword = 'TestPassword123!';
      
      const { data, error } = await supabase.auth.signUp({
        email: testEmail,
        password: testPassword,
        options: {
          data: { name: 'Test User' }
        }
      });

      if (error) {
        alert(`Registration test failed: ${error.message}`);
      } else {
        alert(`Registration test successful! User created: ${data.user?.email}`);
      }
    } catch (error) {
      alert(`Registration test error: ${error}`);
    }
  };

  const StatusIcon = ({ status }: { status: string }) => {
    switch (status) {
      case 'connected':
      case 'configured':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'checking':
      default:
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center">
          <Database className="mx-auto mb-4 w-16 h-16 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">Supabase Debug</h1>
          <p className="text-gray-600 mt-2">Diagnostic information for your Supabase connection</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Environment Variables */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <StatusIcon status={debug.supabaseUrl && debug.supabaseKey ? 'connected' : 'error'} />
                <span>Environment Variables</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div>
                  <strong>SUPABASE_URL:</strong> 
                  <span className={debug.supabaseUrl ? 'text-green-600' : 'text-red-600'}>
                    {debug.supabaseUrl ? ' ✓ Set' : ' ✗ Missing'}
                  </span>
                </div>
                <div>
                  <strong>SUPABASE_ANON_KEY:</strong> 
                  <span className={debug.supabaseKey ? 'text-green-600' : 'text-red-600'}>
                    {debug.supabaseKey ? ' ✓ Set' : ' ✗ Missing'}
                  </span>
                </div>
                {debug.supabaseUrl && (
                  <div className="mt-2 p-2 bg-gray-100 rounded text-xs">
                    URL: {debug.supabaseUrl}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Connection Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <StatusIcon status={debug.connectionStatus} />
                <span>Connection Status</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div>
                  <strong>Supabase Client:</strong> 
                  <span className={debug.connectionStatus === 'connected' ? 'text-green-600' : 'text-red-600'}>
                    {debug.connectionStatus === 'connected' ? ' ✓ Connected' : debug.connectionStatus === 'checking' ? ' Checking...' : ' ✗ Error'}
                  </span>
                </div>
                <div>
                  <strong>Auth Service:</strong> 
                  <span className={debug.authStatus === 'configured' ? 'text-green-600' : 'text-red-600'}>
                    {debug.authStatus === 'configured' ? ' ✓ Working' : debug.authStatus === 'checking' ? ' Checking...' : ' ✗ Error'}
                  </span>
                </div>
                <div>
                  <strong>Database:</strong> 
                  <span className={debug.databaseStatus === 'connected' ? 'text-green-600' : 'text-red-600'}>
                    {debug.databaseStatus === 'connected' ? ' ✓ Connected' : debug.databaseStatus === 'checking' ? ' Checking...' : ' ✗ Error'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Current User */}
          <Card>
            <CardHeader>
              <CardTitle>Current User</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm">
                {debug.currentUser ? (
                  <div className="space-y-1">
                    <div><strong>Email:</strong> {debug.currentUser.email}</div>
                    <div><strong>Verified:</strong> {debug.currentUser.email_confirmed_at ? 'Yes' : 'No'}</div>
                    <div><strong>ID:</strong> {debug.currentUser.id}</div>
                  </div>
                ) : (
                  <p className="text-gray-600">No user logged in</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Error Information */}
          {debug.errorMessage && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <XCircle className="w-5 h-5 text-red-600" />
                  <span>Error Details</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-red-600 bg-red-50 p-3 rounded">
                  {debug.errorMessage}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Test Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Test Actions</CardTitle>
            <CardDescription>
              Run these tests to verify your Supabase configuration
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-x-4">
              <Button onClick={testRegistration} variant="outline">
                Test Registration
              </Button>
              <Button 
                onClick={() => window.location.href = '/auth/register'} 
                variant="outline"
              >
                Go to Register
              </Button>
              <Button 
                onClick={() => window.location.href = '/auth/login'} 
                variant="outline"
              >
                Go to Login
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Configuration Help */}
        <Card>
          <CardHeader>
            <CardTitle>Configuration Help</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            <p><strong>If you see errors:</strong></p>
            <ol className="list-decimal list-inside space-y-1 text-gray-700">
              <li>Check that environment variables are set in Vercel</li>
              <li>Verify Supabase project is active and not paused</li>
              <li>Run the database schema from the setup guide</li>
              <li>Configure Site URL in Supabase Auth settings</li>
              <li>Enable email confirmations in Supabase Auth</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}