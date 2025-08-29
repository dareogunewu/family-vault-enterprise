'use client';

import Link from 'next/link';
import { Shield, Key, Lock, Users, FileText, Star } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
      {/* Header */}
      <nav className="p-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <Shield className="h-8 w-8 text-white" />
            <span className="text-white text-xl font-bold">Family Vault Enterprise</span>
          </div>
          <div className="space-x-4">
            <Link 
              href="/auth/login"
              className="text-white hover:text-blue-200 font-medium transition-colors"
            >
              Sign In
            </Link>
            <Link 
              href="/auth/register"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-6 pt-20 pb-32">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-white mb-6">
            Secure Your Family's Digital Legacy
          </h1>
          <p className="text-xl text-blue-200 mb-8 max-w-3xl mx-auto">
            Enterprise-grade password management and document storage with YubiKey authentication. 
            Zero-knowledge encryption ensures only your family can access your vault.
          </p>
          <div className="space-x-4">
            <Link 
              href="/auth/register"
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg text-lg font-semibold transition-colors inline-flex items-center"
            >
              <Key className="mr-2 h-5 w-5" />
              Start Free Trial
            </Link>
            <Link 
              href="/auth/login"
              className="border border-white text-white hover:bg-white hover:text-blue-900 px-8 py-3 rounded-lg text-lg font-semibold transition-colors inline-flex items-center"
            >
              <Shield className="mr-2 h-5 w-5" />
              Sign In
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mt-20">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 text-center">
            <div className="bg-blue-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
              <Key className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white mb-4">YubiKey Security</h3>
            <p className="text-blue-200">
              Hardware-based authentication with FIDO2 support. Phishing-resistant security for your entire family.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 text-center">
            <div className="bg-purple-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
              <Lock className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white mb-4">Zero-Knowledge Encryption</h3>
            <p className="text-blue-200">
              ChaCha20-Poly1305 encryption ensures your data is protected even from us. Only you hold the keys.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 text-center">
            <div className="bg-green-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
              <Users className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white mb-4">Family Sharing</h3>
            <p className="text-blue-200">
              Secure password and document sharing with role-based access control for family members.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 text-center">
            <div className="bg-orange-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
              <FileText className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white mb-4">Document Vault</h3>
            <p className="text-blue-200">
              Encrypted document storage with DocuSign integration for important family documents.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 text-center">
            <div className="bg-red-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white mb-4">Breach Monitoring</h3>
            <p className="text-blue-200">
              Continuous monitoring for data breaches with Have I Been Pwned integration.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 text-center">
            <div className="bg-indigo-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
              <Star className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white mb-4">Enterprise Grade</h3>
            <p className="text-blue-200">
              Audit logging, compliance reporting, and professional access controls for peace of mind.
            </p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center mt-20">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-12 max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-white mb-4">
              Ready to Secure Your Family's Digital Future?
            </h2>
            <p className="text-blue-200 mb-8 text-lg">
              Join thousands of families who trust Family Vault Enterprise to protect their most important digital assets.
            </p>
            <div className="space-x-4">
              <Link 
                href="/auth/register"
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg text-lg font-semibold transition-colors inline-flex items-center"
              >
                <Key className="mr-2 h-5 w-5" />
                Start Your Free Trial
              </Link>
              <Link 
                href="/auth/login"
                className="text-white hover:text-blue-200 font-medium transition-colors"
              >
                Already have an account? Sign in →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
