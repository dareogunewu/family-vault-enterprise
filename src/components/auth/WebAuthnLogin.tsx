'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Shield, Key, AlertCircle } from 'lucide-react';
import { startAuthentication, startRegistration } from '@simplewebauthn/browser';

interface WebAuthnLoginProps {
  onAuthSuccess: (token: string) => void;
  onRegistrationSuccess: () => void;
  mode: 'login' | 'register';
}

export function WebAuthnLogin({ onAuthSuccess, onRegistrationSuccess, mode }: WebAuthnLoginProps) {
  const [email, setEmail] = useState('');
  const [deviceName, setDeviceName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'email' | 'webauthn'>('email');

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      if (mode === 'login') {
        await initiateLogin();
      } else {
        setStep('webauthn');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const initiateLogin = async () => {
    try {
      // Get authentication challenge
      const challengeResponse = await fetch('/api/auth/webauthn/authenticate/begin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: email }),
      });

      if (!challengeResponse.ok) {
        const errorData = await challengeResponse.json();
        throw new Error(errorData.error || 'Failed to initiate authentication');
      }

      const { data: authOptions } = await challengeResponse.json();

      // Start WebAuthn authentication
      const authResponse = await startAuthentication(authOptions);

      // Verify authentication
      const verifyResponse = await fetch('/api/auth/webauthn/authenticate/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          credential: authResponse,
          userId: authOptions.userId,
        }),
      });

      if (!verifyResponse.ok) {
        const errorData = await verifyResponse.json();
        throw new Error(errorData.error || 'Authentication failed');
      }

      const { data } = await verifyResponse.json();
      onAuthSuccess(data.token);
    } catch (err) {
      if (err.name === 'NotAllowedError') {
        throw new Error('Authentication was cancelled or timed out');
      } else if (err.name === 'NotSupportedError') {
        throw new Error('WebAuthn is not supported by your browser');
      } else if (err.name === 'SecurityError') {
        throw new Error('Security error occurred during authentication');
      } else {
        throw err;
      }
    }
  };

  const handleWebAuthnRegistration = async () => {
    if (!deviceName.trim()) {
      setError('Please enter a device name');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Get registration challenge
      const challengeResponse = await fetch('/api/auth/webauthn/register/begin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: email,
          deviceName,
        }),
      });

      if (!challengeResponse.ok) {
        const errorData = await challengeResponse.json();
        throw new Error(errorData.error || 'Failed to initiate registration');
      }

      const { data: regOptions } = await challengeResponse.json();

      // Start WebAuthn registration
      const regResponse = await startRegistration(regOptions);

      // Verify registration
      const verifyResponse = await fetch('/api/auth/webauthn/register/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          credential: regResponse,
          deviceName,
          username: email,
        }),
      });

      if (!verifyResponse.ok) {
        const errorData = await verifyResponse.json();
        throw new Error(errorData.error || 'Registration failed');
      }

      onRegistrationSuccess();
    } catch (err) {
      if (err.name === 'NotAllowedError') {
        setError('Registration was cancelled or timed out');
      } else if (err.name === 'NotSupportedError') {
        setError('WebAuthn is not supported by your browser');
      } else if (err.name === 'SecurityError') {
        setError('Security error occurred during registration');
      } else {
        setError(err instanceof Error ? err.message : 'Registration failed');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    setStep('email');
    setError('');
  };

  if (step === 'webauthn' && mode === 'register') {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <Key className="w-6 h-6 text-blue-600" />
          </div>
          <CardTitle>Register YubiKey</CardTitle>
          <CardDescription>
            Connect and register your YubiKey for secure authentication
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="deviceName">Device Name</Label>
            <Input
              id="deviceName"
              type="text"
              placeholder="My YubiKey"
              value={deviceName}
              onChange={(e) => setDeviceName(e.target.value)}
              disabled={isLoading}
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-3">
            <Button
              onClick={handleWebAuthnRegistration}
              disabled={isLoading || !deviceName.trim()}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Registering...
                </>
              ) : (
                <>
                  <Shield className="mr-2 h-4 w-4" />
                  Register YubiKey
                </>
              )}
            </Button>

            <Button
              variant="outline"
              onClick={handleRetry}
              disabled={isLoading}
              className="w-full"
            >
              Back
            </Button>
          </div>

          <div className="text-center text-sm text-gray-600">
            <p>Make sure your YubiKey is connected</p>
            <p>You may need to touch your YubiKey when prompted</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
          <Shield className="w-6 h-6 text-green-600" />
        </div>
        <CardTitle>
          {mode === 'login' ? 'Secure Login' : 'Account Registration'}
        </CardTitle>
        <CardDescription>
          {mode === 'login' 
            ? 'Use your YubiKey for secure authentication'
            : 'Set up your account with YubiKey protection'
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleEmailSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              required
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button
            type="submit"
            disabled={isLoading || !email.trim()}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {mode === 'login' ? 'Authenticating...' : 'Continuing...'}
              </>
            ) : (
              <>
                <Key className="mr-2 h-4 w-4" />
                {mode === 'login' ? 'Login with YubiKey' : 'Continue to Registration'}
              </>
            )}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-600">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <Shield className="w-4 h-4" />
            <span>Hardware Security Key Required</span>
          </div>
          <p>
            {mode === 'login' 
              ? 'Touch your YubiKey when the light blinks'
              : "You'll need a YubiKey to complete registration"
            }
          </p>
        </div>
      </CardContent>
    </Card>
  );
}