-- Family Vault Enterprise - Simplified Database Schema
-- Run this SQL in your Supabase SQL Editor step by step

-- Step 1: Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Step 2: Create users table first (no dependencies)
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

-- Step 3: Create organizations table (depends on users)
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

-- Step 4: Create organization_users table (depends on organizations and users)
CREATE TABLE IF NOT EXISTS public.organization_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES public.organizations(id) NOT NULL,
  user_id UUID REFERENCES public.users(id) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'member', 'viewer', 'emergency')),
  status VARCHAR(20) DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'active', 'inactive')),
  permissions JSONB DEFAULT '[]'::jsonb,
  encrypted_org_key TEXT,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_access TIMESTAMP WITH TIME ZONE
);

-- Step 5: Create folders table
CREATE TABLE IF NOT EXISTS public.folders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) NOT NULL,
  organization_id UUID REFERENCES public.organizations(id),
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 6: Create ciphers table (main vault items)
CREATE TABLE IF NOT EXISTS public.ciphers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) NOT NULL,
  organization_id UUID REFERENCES public.organizations(id),
  folder_id UUID REFERENCES public.folders(id),
  type INTEGER NOT NULL CHECK (type IN (1, 2, 3, 4, 5, 6)),
  encrypted_name TEXT NOT NULL,
  encrypted_notes TEXT,
  favorite BOOLEAN DEFAULT false,
  reprompt INTEGER DEFAULT 0 CHECK (reprompt IN (0, 1, 2)),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Step 7: Create cipher sub-tables
CREATE TABLE IF NOT EXISTS public.cipher_logins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cipher_id UUID REFERENCES public.ciphers(id) ON DELETE CASCADE NOT NULL,
  encrypted_username TEXT,
  encrypted_password TEXT,
  encrypted_totp TEXT,
  password_revision_date TIMESTAMP WITH TIME ZONE,
  autofill_on_page_load BOOLEAN DEFAULT false,
  uris JSONB DEFAULT '[]'::jsonb
);

CREATE TABLE IF NOT EXISTS public.cipher_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cipher_id UUID REFERENCES public.ciphers(id) ON DELETE CASCADE NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  size INTEGER NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  category VARCHAR(100) NOT NULL,
  encrypted BOOLEAN DEFAULT true,
  signed BOOLEAN DEFAULT false,
  storage_key TEXT,
  upload_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  docusign_envelope_id VARCHAR(100),
  shared_with JSONB DEFAULT '[]'::jsonb
);

CREATE TABLE IF NOT EXISTS public.cipher_cards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cipher_id UUID REFERENCES public.ciphers(id) ON DELETE CASCADE NOT NULL,
  encrypted_cardholder_name TEXT,
  encrypted_number TEXT,
  encrypted_brand TEXT,
  encrypted_exp_month TEXT,
  encrypted_exp_year TEXT,
  encrypted_code TEXT
);

CREATE TABLE IF NOT EXISTS public.cipher_identities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cipher_id UUID REFERENCES public.ciphers(id) ON DELETE CASCADE NOT NULL,
  encrypted_title TEXT,
  encrypted_first_name TEXT,
  encrypted_middle_name TEXT,
  encrypted_last_name TEXT,
  encrypted_address1 TEXT,
  encrypted_address2 TEXT,
  encrypted_address3 TEXT,
  encrypted_city TEXT,
  encrypted_state TEXT,
  encrypted_postal_code TEXT,
  encrypted_country TEXT,
  encrypted_company TEXT,
  encrypted_email TEXT,
  encrypted_phone TEXT,
  encrypted_ssn TEXT,
  encrypted_username TEXT,
  encrypted_passport_number TEXT,
  encrypted_license_number TEXT
);

-- Step 8: Create additional tables
CREATE TABLE IF NOT EXISTS public.password_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cipher_id UUID REFERENCES public.ciphers(id) ON DELETE CASCADE NOT NULL,
  encrypted_password TEXT NOT NULL,
  last_used_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.emergency_access (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  grantor_id UUID REFERENCES public.users(id) NOT NULL,
  grantee_id UUID REFERENCES public.users(id) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('view', 'takeover')),
  wait_time_days INTEGER NOT NULL,
  status VARCHAR(30) DEFAULT 'invited' NOT NULL,
  emergency_key_encrypted TEXT,
  request_initiated TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES public.users(id),
  organization_id UUID REFERENCES public.organizations(id),
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50) NOT NULL,
  resource_id UUID,
  ip_address INET,
  user_agent TEXT,
  metadata JSONB,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 9: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_ciphers_user_id ON public.ciphers(user_id);
CREATE INDEX IF NOT EXISTS idx_ciphers_type ON public.ciphers(type);
CREATE INDEX IF NOT EXISTS idx_ciphers_organization_id ON public.ciphers(organization_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON public.audit_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_organization_users_user_id ON public.organization_users(user_id);
CREATE INDEX IF NOT EXISTS idx_organization_users_org_id ON public.organization_users(organization_id);

-- Step 10: Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ciphers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cipher_logins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cipher_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cipher_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cipher_identities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.password_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Step 11: Create RLS policies (basic ones first)
-- Users can only see their own data
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Organization owners can manage their organizations
CREATE POLICY "Owners can manage organizations" ON public.organizations
  FOR ALL USING (auth.uid() = owner_id);

-- Users can manage their own organization memberships
CREATE POLICY "Users can view own memberships" ON public.organization_users
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Org owners can manage memberships" ON public.organization_users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.organizations 
      WHERE id = organization_id AND owner_id = auth.uid()
    )
  );

-- Users can manage their own folders
CREATE POLICY "Users can manage own folders" ON public.folders
  FOR ALL USING (auth.uid() = user_id);

-- Users can manage their own ciphers
CREATE POLICY "Users can manage own ciphers" ON public.ciphers
  FOR ALL USING (auth.uid() = user_id);

-- Cipher sub-tables follow cipher access
CREATE POLICY "Cipher logins follow cipher access" ON public.cipher_logins
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.ciphers 
      WHERE id = cipher_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Cipher documents follow cipher access" ON public.cipher_documents
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.ciphers 
      WHERE id = cipher_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Cipher cards follow cipher access" ON public.cipher_cards
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.ciphers 
      WHERE id = cipher_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Cipher identities follow cipher access" ON public.cipher_identities
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.ciphers 
      WHERE id = cipher_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Password history follows cipher access" ON public.password_history
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.ciphers 
      WHERE id = cipher_id AND user_id = auth.uid()
    )
  );

-- Emergency access policies
CREATE POLICY "Emergency access visibility" ON public.emergency_access
  FOR ALL USING (auth.uid() = grantor_id OR auth.uid() = grantee_id);

-- Audit logs - users can only see their own
CREATE POLICY "Users can view own audit logs" ON public.audit_logs
  FOR SELECT USING (auth.uid() = user_id);

-- Step 12: Create update timestamp function and triggers
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER organizations_updated_at BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER ciphers_updated_at BEFORE UPDATE ON public.ciphers
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Step 13: Create storage bucket for documents
INSERT INTO storage.buckets (id, name, public) 
VALUES ('vault-documents', 'vault-documents', false)
ON CONFLICT (id) DO NOTHING;