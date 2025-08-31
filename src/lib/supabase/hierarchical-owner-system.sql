-- Hierarchical Owner System for Family Vault Enterprise
-- Ensures dareogunewu@gmail.com is the super owner who can invite other owners
-- Creates missing tables and functions needed for the owner console

-- Step 1: Create missing tables for owner system
CREATE TABLE IF NOT EXISTS public.system_owners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) UNIQUE NOT NULL,
  email VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'invited_owner' NOT NULL,
  owner_type VARCHAR(50) DEFAULT 'invited_owner' CHECK (owner_type IN ('super_owner', 'invited_owner')),
  can_invite_owners BOOLEAN DEFAULT false,
  permissions JSONB DEFAULT '[\"billing\", \"users\", \"analytics\", \"settings\"]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  added_by UUID REFERENCES auth.users(id),
  invited_by UUID REFERENCES auth.users(id),
  notes TEXT,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS public.security_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  alert_type VARCHAR(100) NOT NULL,
  severity VARCHAR(20) NOT NULL CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  user_id UUID REFERENCES auth.users(id),
  details JSONB,
  resolved BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID REFERENCES auth.users(id)
);

-- Step 2: Update system owners table to include owner hierarchy (safe)
ALTER TABLE public.system_owners ADD COLUMN IF NOT EXISTS owner_type VARCHAR(50) DEFAULT 'invited_owner' CHECK (owner_type IN ('super_owner', 'invited_owner'));
ALTER TABLE public.system_owners ADD COLUMN IF NOT EXISTS can_invite_owners BOOLEAN DEFAULT false;
ALTER TABLE public.system_owners ADD COLUMN IF NOT EXISTS invited_by UUID REFERENCES auth.users(id);

-- Step 3: Set dareogunewu@gmail.com as the super owner
UPDATE public.system_owners 
SET 
  owner_type = 'super_owner',
  can_invite_owners = true,
  role = 'super_owner'
WHERE email = 'dareogunewu@gmail.com';

-- Insert super owner record if it doesn't exist
INSERT INTO public.system_owners (user_id, email, name, owner_type, role, can_invite_owners, permissions, notes)
SELECT 
  au.id as user_id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'name', au.email) as name,
  'super_owner' as owner_type,
  'super_owner' as role,
  true as can_invite_owners,
  '[\"full_access\", \"billing\", \"users\", \"analytics\", \"settings\", \"owner_management\", \"invite_owners\"]'::jsonb as permissions,
  'Super owner - can invite other owners' as notes
FROM auth.users au
WHERE au.email = 'dareogunewu@gmail.com'
ON CONFLICT (user_id) DO UPDATE SET
  owner_type = 'super_owner',
  role = 'super_owner',
  can_invite_owners = true,
  permissions = '[\"full_access\", \"billing\", \"users\", \"analytics\", \"settings\", \"owner_management\", \"invite_owners\"]'::jsonb,
  updated_at = NOW();

-- Step 4: Enhanced function to check if user is system owner (any level)
CREATE OR REPLACE FUNCTION public.is_system_owner(check_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
DECLARE
  user_email TEXT;
  is_owner BOOLEAN := false;
BEGIN
  -- Get the user's email from auth.users
  SELECT email INTO user_email
  FROM auth.users
  WHERE id = check_user_id;
  
  -- Check if user is the super owner OR an invited owner
  IF user_email = 'dareogunewu@gmail.com' THEN
    is_owner := true;
  ELSE
    -- Check if user is an invited owner in system_owners table
    SELECT EXISTS(
      SELECT 1 FROM public.system_owners 
      WHERE user_id = check_user_id AND is_active = true
    ) INTO is_owner;
  END IF;
  
  RETURN is_owner;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 5: Function to check if user can invite other owners (only super owner)
CREATE OR REPLACE FUNCTION public.can_invite_owners(check_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
DECLARE
  user_email TEXT;
BEGIN
  -- Get the user's email from auth.users
  SELECT email INTO user_email
  FROM auth.users
  WHERE id = check_user_id;
  
  -- Only dareogunewu@gmail.com can invite other owners
  RETURN user_email = 'dareogunewu@gmail.com';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 6: Function to get owner details with hierarchy info
CREATE OR REPLACE FUNCTION public.get_owner_details(check_user_id UUID DEFAULT auth.uid())
RETURNS TABLE(
  id UUID,
  email TEXT,
  name TEXT,
  role VARCHAR(50),
  owner_type VARCHAR(50),
  can_invite BOOLEAN,
  permissions JSONB,
  is_super_owner BOOLEAN,
  added_at TIMESTAMP WITH TIME ZONE,
  last_login TIMESTAMP WITH TIME ZONE
) AS $$
DECLARE
  user_email TEXT;
BEGIN
  -- Only system owners can call this function
  IF NOT public.is_system_owner(check_user_id) THEN
    RAISE EXCEPTION 'Access denied. System owner privileges required.';
  END IF;

  -- Get user email
  SELECT au.email INTO user_email
  FROM auth.users au
  WHERE au.id = check_user_id;

  -- Return owner details
  IF user_email = 'dareogunewu@gmail.com' THEN
    -- Super owner details
    RETURN QUERY
    SELECT 
      check_user_id as id,
      user_email as email,
      COALESCE((SELECT raw_user_meta_data->>'name' FROM auth.users WHERE id = check_user_id), user_email) as name,
      'super_owner'::VARCHAR(50) as role,
      'super_owner'::VARCHAR(50) as owner_type,
      true as can_invite,
      '[\"full_access\", \"billing\", \"users\", \"analytics\", \"settings\", \"owner_management\", \"invite_owners\"]'::jsonb as permissions,
      true as is_super_owner,
      NOW() as added_at,
      (SELECT last_sign_in_at FROM auth.users WHERE id = check_user_id) as last_login;
  ELSE
    -- Invited owner details
    RETURN QUERY
    SELECT 
      so.id,
      so.email::TEXT,
      so.name::TEXT,
      so.role,
      so.owner_type,
      so.can_invite_owners as can_invite,
      so.permissions,
      false as is_super_owner,
      so.added_at,
      so.last_login
    FROM public.system_owners so
    WHERE so.user_id = check_user_id AND so.is_active = true;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 7: Enhanced function to add system owner (only super owner can do this)
CREATE OR REPLACE FUNCTION public.add_system_owner(
  target_email VARCHAR(255),
  target_name VARCHAR(255),
  owner_role VARCHAR(50) DEFAULT 'invited_owner',
  owner_permissions JSONB DEFAULT '[\"billing\", \"users\", \"analytics\", \"settings\"]'::jsonb,
  notes_param TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  target_user_id UUID;
  new_owner_id UUID;
  inviter_email TEXT;
BEGIN
  -- Only the super owner can invite new owners
  IF NOT public.can_invite_owners() THEN
    RAISE EXCEPTION 'Access denied. Only the super owner can invite other owners.';
  END IF;

  -- Get inviter's email for logging
  SELECT email INTO inviter_email FROM auth.users WHERE id = auth.uid();

  -- Get user_id from email (must be existing user)
  SELECT id INTO target_user_id
  FROM auth.users
  WHERE email = target_email;

  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'User with email % not found. User must register first.', target_email;
  END IF;

  -- Prevent inviting the super owner (already has access)
  IF target_email = 'dareogunewu@gmail.com' THEN
    RAISE EXCEPTION 'Cannot invite the super owner. Super owner already has full access.';
  END IF;

  -- Check if already a system owner
  IF public.is_system_owner(target_user_id) THEN
    RAISE EXCEPTION 'User % is already a system owner.', target_email;
  END IF;

  -- Add new system owner (always as invited_owner, never super_owner)
  INSERT INTO public.system_owners (
    user_id,
    email,
    name,
    role,
    owner_type,
    can_invite_owners,
    permissions,
    added_by,
    invited_by,
    notes
  ) VALUES (
    target_user_id,
    target_email,
    target_name,
    owner_role,
    'invited_owner', -- Always invited owner, never super owner
    false, -- Invited owners cannot invite others
    owner_permissions,
    auth.uid(),
    auth.uid(),
    COALESCE(notes_param, 'Invited by super owner: ' || inviter_email)
  ) RETURNING id INTO new_owner_id;

  -- Log the action
  INSERT INTO public.audit_logs (
    user_id,
    action,
    resource_type,
    resource_id,
    metadata,
    timestamp
  ) VALUES (
    auth.uid(),
    'system_owner_invited',
    'system_owner',
    new_owner_id,
    jsonb_build_object(
      'target_email', target_email,
      'target_name', target_name,
      'role', owner_role,
      'permissions', owner_permissions,
      'inviter_email', inviter_email
    ),
    NOW()
  );

  -- Generate success notification
  INSERT INTO public.security_alerts (
    alert_type,
    severity,
    user_id,
    details,
    created_at
  ) VALUES (
    'OWNER_INVITED',
    'MEDIUM',
    auth.uid(),
    jsonb_build_object(
      'action', 'owner_invitation_sent',
      'target_email', target_email,
      'inviter_email', inviter_email,
      'timestamp', NOW()
    ),
    NOW()
  );

  RETURN new_owner_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 8: Function to remove system owner (only super owner can do this)
CREATE OR REPLACE FUNCTION public.remove_system_owner(
  target_email VARCHAR(255),
  reason TEXT DEFAULT 'Removed by super owner'
)
RETURNS BOOLEAN AS $$
DECLARE
  target_user_id UUID;
  target_owner_id UUID;
  remover_email TEXT;
BEGIN
  -- Only the super owner can remove other owners
  IF NOT public.can_invite_owners() THEN
    RAISE EXCEPTION 'Access denied. Only the super owner can remove other owners.';
  END IF;

  -- Get remover's email for logging
  SELECT email INTO remover_email FROM auth.users WHERE id = auth.uid();

  -- Cannot remove the super owner
  IF target_email = 'dareogunewu@gmail.com' THEN
    RAISE EXCEPTION 'Cannot remove the super owner.';
  END IF;

  -- Get user_id from email
  SELECT id INTO target_user_id
  FROM auth.users
  WHERE email = target_email;

  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'User with email % not found.', target_email;
  END IF;

  -- Get owner record
  SELECT id INTO target_owner_id
  FROM public.system_owners
  WHERE user_id = target_user_id AND is_active = true;

  IF target_owner_id IS NULL THEN
    RAISE EXCEPTION 'User % is not a system owner.', target_email;
  END IF;

  -- Deactivate the owner
  UPDATE public.system_owners
  SET 
    is_active = false,
    updated_at = NOW(),
    notes = COALESCE(notes || E'\n', '') || 'Removed by super owner: ' || reason
  WHERE id = target_owner_id;

  -- Log the action
  INSERT INTO public.audit_logs (
    user_id,
    action,
    resource_type,
    resource_id,
    metadata,
    timestamp
  ) VALUES (
    auth.uid(),
    'system_owner_removed',
    'system_owner',
    target_owner_id,
    jsonb_build_object(
      'target_email', target_email,
      'reason', reason,
      'remover_email', remover_email
    ),
    NOW()
  );

  -- Generate security alert
  INSERT INTO public.security_alerts (
    alert_type,
    severity,
    user_id,
    details,
    created_at
  ) VALUES (
    'OWNER_REMOVED',
    'HIGH',
    auth.uid(),
    jsonb_build_object(
      'action', 'owner_access_revoked',
      'target_email', target_email,
      'remover_email', remover_email,
      'reason', reason,
      'timestamp', NOW()
    ),
    NOW()
  );

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 9: Function to list all system owners (viewable by any system owner)
CREATE OR REPLACE FUNCTION public.list_system_owners()
RETURNS TABLE(
  id UUID,
  email TEXT,
  name TEXT,
  role VARCHAR(50),
  owner_type VARCHAR(50),
  can_invite BOOLEAN,
  is_active BOOLEAN,
  added_at TIMESTAMP WITH TIME ZONE,
  added_by_email TEXT,
  last_login TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  -- Only system owners can view the owner list
  IF NOT public.is_system_owner() THEN
    RAISE EXCEPTION 'Access denied. System owner privileges required.';
  END IF;

  RETURN QUERY
  SELECT 
    so.id,
    so.email::TEXT,
    so.name::TEXT,
    so.role,
    so.owner_type,
    so.can_invite_owners as can_invite,
    so.is_active,
    so.added_at,
    inviter.email::TEXT as added_by_email,
    so.last_login
  FROM public.system_owners so
  LEFT JOIN auth.users inviter ON so.added_by = inviter.id
  WHERE so.is_active = true
  
  UNION ALL
  
  -- Include super owner
  SELECT 
    au.id,
    au.email::TEXT,
    COALESCE(au.raw_user_meta_data->>'name', au.email)::TEXT as name,
    'super_owner'::VARCHAR(50) as role,
    'super_owner'::VARCHAR(50) as owner_type,
    true as can_invite,
    true as is_active,
    au.created_at as added_at,
    'SYSTEM'::TEXT as added_by_email,
    au.last_sign_in_at as last_login
  FROM auth.users au
  WHERE au.email = 'dareogunewu@gmail.com'
  
  ORDER BY added_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 10: Create comprehensive metrics functions
CREATE OR REPLACE FUNCTION public.get_business_metrics(check_user_id UUID DEFAULT auth.uid())
RETURNS TABLE(
  total_users INTEGER,
  active_users INTEGER,
  total_organizations INTEGER,
  total_ciphers INTEGER,
  security_alerts INTEGER,
  recent_registrations INTEGER
) AS $$
BEGIN
  -- Only system owners can view business metrics
  IF NOT public.is_system_owner(check_user_id) THEN
    RAISE EXCEPTION 'Access denied. System owner privileges required.';
  END IF;

  RETURN QUERY
  SELECT 
    (SELECT COUNT(*)::INTEGER FROM public.users WHERE is_active = true) as total_users,
    (SELECT COUNT(*)::INTEGER FROM public.users WHERE last_login > NOW() - INTERVAL '30 days') as active_users,
    (SELECT COUNT(*)::INTEGER FROM public.organizations) as total_organizations,
    (SELECT COUNT(*)::INTEGER FROM public.ciphers WHERE deleted_at IS NULL) as total_ciphers,
    (SELECT COUNT(*)::INTEGER FROM public.security_alerts WHERE resolved = false) as security_alerts,
    (SELECT COUNT(*)::INTEGER FROM public.users WHERE created_at > NOW() - INTERVAL '7 days') as recent_registrations;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 11: Enable RLS on new tables
ALTER TABLE public.system_owners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_alerts ENABLE ROW LEVEL SECURITY;

-- Step 12: Create RLS policies
CREATE POLICY "Only system owners can manage system_owners" ON public.system_owners
  FOR ALL USING (public.is_system_owner());

CREATE POLICY "Only system owners can view security_alerts" ON public.security_alerts
  FOR SELECT USING (public.is_system_owner());

-- Step 13: Grant permissions
GRANT EXECUTE ON FUNCTION public.is_system_owner(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_invite_owners(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_owner_details(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.add_system_owner(VARCHAR, VARCHAR, VARCHAR, JSONB, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.remove_system_owner(VARCHAR, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_system_owners() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_business_metrics(UUID) TO authenticated;

-- Step 14: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_system_owners_user_id ON public.system_owners(user_id);
CREATE INDEX IF NOT EXISTS idx_system_owners_email ON public.system_owners(email);
CREATE INDEX IF NOT EXISTS idx_system_owners_owner_type ON public.system_owners(owner_type);
CREATE INDEX IF NOT EXISTS idx_system_owners_can_invite ON public.system_owners(can_invite_owners);
CREATE INDEX IF NOT EXISTS idx_system_owners_invited_by ON public.system_owners(invited_by);
CREATE INDEX IF NOT EXISTS idx_security_alerts_user_id ON public.security_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_security_alerts_created_at ON public.security_alerts(created_at);
CREATE INDEX IF NOT EXISTS idx_security_alerts_resolved ON public.security_alerts(resolved);

-- Step 15: Create triggers for updated_at
DROP TRIGGER IF EXISTS system_owners_updated_at ON public.system_owners;
CREATE TRIGGER system_owners_updated_at BEFORE UPDATE ON public.system_owners
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Success message
DO $$
BEGIN
  RAISE NOTICE '=== HIERARCHICAL OWNER SYSTEM IMPLEMENTED ===';
  RAISE NOTICE 'Super Owner: dareogunewu@gmail.com (can invite others)';
  RAISE NOTICE 'Invited Owners: Can access console but cannot invite others';
  RAISE NOTICE 'Functions created:';
  RAISE NOTICE '- is_system_owner() - Check if user is any type of owner';
  RAISE NOTICE '- can_invite_owners() - Check invitation privileges';
  RAISE NOTICE '- get_owner_details() - Get owner info with hierarchy';
  RAISE NOTICE '- list_system_owners() - List all owners';
  RAISE NOTICE '- add_system_owner() - Invite new owners (super owner only)';
  RAISE NOTICE '- remove_system_owner() - Remove owners (super owner only)';
  RAISE NOTICE '- get_business_metrics() - Business dashboard metrics';
  RAISE NOTICE '=== SYSTEM READY ===';
END $$;