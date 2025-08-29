'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Database, AlertCircle, Loader } from 'lucide-react';

export default function SetupPage() {
  const [status, setStatus] = useState<'idle' | 'initializing' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const initializeDatabase = async () => {
    setStatus('initializing');
    setMessage('Creating database tables...');

    try {
      const response = await fetch('/api/init-db', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        setStatus('success');
        setMessage('Database initialized successfully! Your Family Vault Enterprise is ready.');
      } else {
        setStatus('error');
        setMessage(data.error || 'Failed to initialize database');
      }
    } catch (error) {
      setStatus('error');
      setMessage('Network error: ' + (error as Error).message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <Database className="h-12 w-12 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold">Family Vault Enterprise</CardTitle>
          <CardDescription>
            Database Setup
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {status === 'idle' && (
            <>
              <p className="text-sm text-gray-600 text-center">
                Initialize your database to get started with Family Vault Enterprise. 
                This will create all necessary tables for secure password management, 
                document storage, and family access control.
              </p>
              <Button 
                onClick={initializeDatabase}
                className="w-full"
                size="lg"
              >
                Initialize Database
              </Button>
            </>
          )}

          {status === 'initializing' && (
            <>
              <div className="flex items-center justify-center space-x-2">
                <Loader className="h-5 w-5 animate-spin text-blue-600" />
                <span className="text-sm font-medium">Initializing...</span>
              </div>
              <p className="text-sm text-gray-600 text-center">
                {message}
              </p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="flex items-center justify-center space-x-2 text-green-600">
                <CheckCircle className="h-6 w-6" />
                <span className="font-semibold">Success!</span>
              </div>
              <p className="text-sm text-gray-600 text-center">
                {message}
              </p>
              <Button 
                onClick={() => window.location.href = '/'}
                className="w-full bg-green-600 hover:bg-green-700"
                size="lg"
              >
                Go to Family Vault
              </Button>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="flex items-center justify-center space-x-2 text-red-600">
                <AlertCircle className="h-6 w-6" />
                <span className="font-semibold">Error</span>
              </div>
              <p className="text-sm text-red-600 text-center">
                {message}
              </p>
              <Button 
                onClick={initializeDatabase}
                variant="outline"
                className="w-full"
                size="lg"
              >
                Try Again
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}