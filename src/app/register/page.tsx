'use client';

import { useState } from 'react';
import { WebAuthnLogin } from '@/components/auth/WebAuthnLogin';
import Link from 'next/link';

export default function RegisterPage() {
  const [isRegistered, setIsRegistered] = useState(false);

  const handleRegistrationSuccess = () => {
    setIsRegistered(true);
  };

  const handleAuthSuccess = (token: string) => {
    // This shouldn't be called in register mode, but handle it anyway
    console.log('Auth success with token:', token);
    window.location.href = '/dashboard';
  };

  if (isRegistered) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Registration Complete!</h1>
            <p className="text-gray-600">Your YubiKey has been successfully registered.</p>
          </div>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">
                  YubiKey Registration Successful
                </h3>
                <div className="mt-2 text-sm text-green-700">
                  <p>Your hardware security key is now registered and ready to use.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <Link 
              href="/login"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 block text-center"
            >
              Continue to Login
            </Link>
            
            <Link 
              href="/"
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors duration-200 block text-center"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Account</h1>
          <p className="text-gray-600">Register your YubiKey for secure access to Family Vault Enterprise</p>
        </div>

        <WebAuthnLogin 
          mode="register"
          onAuthSuccess={handleAuthSuccess}
          onRegistrationSuccess={handleRegistrationSuccess}
        />

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <Link href="/login" className="text-blue-600 hover:text-blue-500 font-medium">
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}