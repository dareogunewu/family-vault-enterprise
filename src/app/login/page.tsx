'use client';

import { useState } from 'react';
import { WebAuthnLogin } from '@/components/auth/WebAuthnLogin';

export default function LoginPage() {
  const [authSuccess, setAuthSuccess] = useState(false);

  const handleAuthSuccess = (token: string) => {
    console.log('Authentication successful, token:', token);
    localStorage.setItem('authToken', token);
    setAuthSuccess(true);
    // In a real app, you'd redirect to dashboard
    window.location.href = '/dashboard';
  };

  const handleRegistrationSuccess = () => {
    console.log('Registration successful');
    // Show success message and allow login
  };

  if (authSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-center">
          <h1 className="text-4xl font-bold mb-4">Authentication Successful!</h1>
          <p>Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Family Vault Enterprise</h1>
          <p className="text-blue-200">Secure your family's digital legacy</p>
        </div>
        
        <WebAuthnLogin
          onAuthSuccess={handleAuthSuccess}
          onRegistrationSuccess={handleRegistrationSuccess}
          mode="login"
        />
      </div>
    </div>
  );
}