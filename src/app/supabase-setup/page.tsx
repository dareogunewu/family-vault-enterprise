'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Database, ExternalLink, Copy, CheckCircle, AlertCircle } from 'lucide-react';

export default function SupabaseSetupPage() {
  const [step, setStep] = useState(1);
  const [credentials, setCredentials] = useState({
    url: 'https://anrhqraxiqgpxraeglln.supabase.co',
    anonKey: '',
    serviceKey: ''
  });
  
  const projectId = 'anrhqraxiqgpxraeglln';
  const sqlSchema = `-- Family Vault Enterprise Database Schema for Supabase
-- Copy and paste this into your Supabase SQL Editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  master_key_hash TEXT NOT NULL,
  encrypted_user_key TEXT NOT NULL,
  email_verified BOOLEAN DEFAULT false,
  two_factor_enabled BOOLEAN DEFAULT false,
  emergency_access_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true
);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Users can only see their own data
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Organizations (Families)
CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  owner_id UUID REFERENCES public.users(id) NOT NULL,
  encrypted_org_key TEXT NOT NULL,
  plan_type VARCHAR(50) DEFAULT 'family' NOT NULL,
  max_members INTEGER DEFAULT 6 NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- Organization Members
CREATE TABLE IF NOT EXISTS public.organization_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES public.organizations(id) NOT NULL,
  user_id UUID REFERENCES public.users(id) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'member', 'viewer', 'emergency')),
  status VARCHAR(20) DEFAULT 'pending' NOT NULL,
  permissions JSONB DEFAULT '[]'::jsonb,
  encrypted_org_key TEXT,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_access TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.organization_users ENABLE ROW LEVEL SECURITY;

-- Ciphers (main vault items)
CREATE TABLE IF NOT EXISTS public.ciphers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) NOT NULL,
  organization_id UUID REFERENCES public.organizations(id),
  folder_id UUID,
  type INTEGER NOT NULL CHECK (type IN (1, 2, 3, 4, 5, 6)),
  encrypted_name TEXT NOT NULL,
  encrypted_notes TEXT,
  favorite BOOLEAN DEFAULT false,
  reprompt INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.ciphers ENABLE ROW LEVEL SECURITY;

-- Create basic indexes
CREATE INDEX IF NOT EXISTS idx_ciphers_user_id ON public.ciphers(user_id);
CREATE INDEX IF NOT EXISTS idx_organization_users_user_id ON public.organization_users(user_id);

-- Basic policies for now
CREATE POLICY "Users can manage own ciphers" ON public.ciphers
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Organization users can view memberships" ON public.organization_users
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Organization owners can manage" ON public.organizations
  FOR ALL USING (auth.uid() = owner_id);`;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
            <Database className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Supabase Setup</h1>
          <p className="text-gray-600 mt-2">Configure your Family Vault Enterprise database</p>
        </div>

        {/* Step Indicators */}
        <div className="flex justify-center space-x-4 mb-8">
          {[1, 2, 3].map((stepNum) => (
            <div
              key={stepNum}
              className={`flex items-center justify-center w-10 h-10 rounded-full ${
                step >= stepNum ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}
            >
              {step > stepNum ? <CheckCircle className="w-5 h-5" /> : stepNum}
            </div>
          ))}
        </div>

        {/* Step 1: Get API Keys */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <span>Step 1: Get Supabase API Keys</span>
                <ExternalLink className="w-5 h-5 text-blue-600" />
              </CardTitle>
              <CardDescription>
                You need to get your API keys from your Supabase project dashboard
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Project ID:</strong> {projectId}
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div>
                  <Label>1. Go to Supabase API Settings</Label>
                  <div className="flex space-x-2 mt-1">
                    <Button
                      onClick={() => window.open(`https://supabase.com/dashboard/project/${projectId}/settings/api`, '_blank')}
                      variant="outline"
                      size="sm"
                    >
                      <ExternalLink className="w-4 h-4 mr-1" />
                      Open API Settings
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="supabaseUrl">Project URL</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="supabaseUrl"
                      value={credentials.url}
                      onChange={(e) => setCredentials(prev => ({ ...prev, url: e.target.value }))}
                      placeholder="https://your-project.supabase.co"
                    />
                    <Button
                      onClick={() => copyToClipboard(credentials.url)}
                      variant="outline"
                      size="sm"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="anonKey">Anon Key</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="anonKey"
                      value={credentials.anonKey}
                      onChange={(e) => setCredentials(prev => ({ ...prev, anonKey: e.target.value }))}
                      placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    />
                    <Button
                      onClick={() => copyToClipboard(credentials.anonKey)}
                      variant="outline"
                      size="sm"
                      disabled={!credentials.anonKey}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="serviceKey">Service Role Key</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="serviceKey"
                      value={credentials.serviceKey}
                      onChange={(e) => setCredentials(prev => ({ ...prev, serviceKey: e.target.value }))}
                      placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    />
                    <Button
                      onClick={() => copyToClipboard(credentials.serviceKey)}
                      variant="outline"
                      size="sm"
                      disabled={!credentials.serviceKey}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <Button
                  onClick={() => setStep(2)}
                  disabled={!credentials.anonKey || !credentials.serviceKey}
                  className="w-full"
                >
                  Continue to Database Setup
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Create Database Schema */}
        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <span>Step 2: Create Database Schema</span>
                <ExternalLink className="w-5 h-5 text-blue-600" />
              </CardTitle>
              <CardDescription>
                Run this SQL in your Supabase SQL Editor to create all tables
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label>1. Open Supabase SQL Editor</Label>
                  <div className="flex space-x-2 mt-1">
                    <Button
                      onClick={() => window.open(`https://supabase.com/dashboard/project/${projectId}/sql/new`, '_blank')}
                      variant="outline"
                      size="sm"
                    >
                      <ExternalLink className="w-4 h-4 mr-1" />
                      Open SQL Editor
                    </Button>
                  </div>
                </div>

                <div>
                  <Label>2. Copy and paste this SQL schema</Label>
                  <div className="relative">
                    <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-auto max-h-64 border">
                      <code>{sqlSchema}</code>
                    </pre>
                    <Button
                      onClick={() => copyToClipboard(sqlSchema)}
                      className="absolute top-2 right-2"
                      variant="outline"
                      size="sm"
                    >
                      <Copy className="w-4 h-4 mr-1" />
                      Copy SQL
                    </Button>
                  </div>
                </div>

                <Alert>
                  <Database className="h-4 w-4" />
                  <AlertDescription>
                    This creates all necessary tables with Row Level Security (RLS) for your Family Vault Enterprise.
                    Click "Run" in the SQL Editor after pasting.
                  </AlertDescription>
                </Alert>

                <Button
                  onClick={() => setStep(3)}
                  className="w-full"
                >
                  I've Run the SQL Schema
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Update Environment */}
        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CheckCircle className="w-6 h-6 text-green-600" />
                <span>Step 3: Update Environment Variables</span>
              </CardTitle>
              <CardDescription>
                Add these to your Vercel project environment variables
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription>
                  Your database schema should now be created! Add these environment variables to Vercel:
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                <div>
                  <Label className="text-sm font-mono">NEXT_PUBLIC_SUPABASE_URL</Label>
                  <div className="flex space-x-2">
                    <Input value={credentials.url} readOnly className="font-mono text-xs" />
                    <Button
                      onClick={() => copyToClipboard(credentials.url)}
                      variant="outline"
                      size="sm"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-mono">NEXT_PUBLIC_SUPABASE_ANON_KEY</Label>
                  <div className="flex space-x-2">
                    <Input value={credentials.anonKey} readOnly className="font-mono text-xs" />
                    <Button
                      onClick={() => copyToClipboard(credentials.anonKey)}
                      variant="outline"
                      size="sm"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-mono">SUPABASE_SERVICE_ROLE_KEY</Label>
                  <div className="flex space-x-2">
                    <Input value={credentials.serviceKey} readOnly className="font-mono text-xs" />
                    <Button
                      onClick={() => copyToClipboard(credentials.serviceKey)}
                      variant="outline"
                      size="sm"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <Button
                  onClick={() => window.open('https://vercel.com/dareogunewus-projects/family-vault-enterprise/settings/environment-variables', '_blank')}
                  className="w-full"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Open Vercel Environment Variables
                </Button>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  After adding the environment variables to Vercel, redeploy your project to activate Supabase authentication.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}