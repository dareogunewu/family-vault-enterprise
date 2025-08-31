-- System Owners Management
-- Add this to enable multiple system owners for the SaaS business

-- System owners table
CREATE TABLE IF NOT EXISTS public.system_owners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  email VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  
  -- Owner details
  role VARCHAR(50) DEFAULT 'owner' NOT NULL CHECK (role IN ('owner', 'co_owner', 'admin')),
  permissions JSONB DEFAULT '["full_access", "billing", "users", "analytics", "settings"]'::jsonb,
  
  -- Added by whom
  added_by UUID REFERENCES public.system_owners(user_id),
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  notes TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.system_owners ENABLE ROW LEVEL SECURITY;

-- Only system owners can view/manage system owners
CREATE POLICY "System owners can manage owners" ON public.system_owners
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.system_owners 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_system_owners_user_id ON public.system_owners(user_id);
CREATE INDEX IF NOT EXISTS idx_system_owners_email ON public.system_owners(email);
CREATE INDEX IF NOT EXISTS idx_system_owners_role ON public.system_owners(role);
CREATE INDEX IF NOT EXISTS idx_system_owners_active ON public.system_owners(is_active);

-- Function to check if user is system owner
CREATE OR REPLACE FUNCTION public.is_system_owner(check_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.system_owners 
    WHERE user_id = check_user_id AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get system owner details
CREATE OR REPLACE FUNCTION public.get_system_owner_details(check_user_id UUID DEFAULT auth.uid())
RETURNS TABLE(
  id UUID,
  email VARCHAR(255),
  name VARCHAR(255),
  role VARCHAR(50),
  permissions JSONB,
  added_at TIMESTAMP WITH TIME ZONE,
  last_login TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    so.id,
    so.email,
    so.name,
    so.role,
    so.permissions,
    so.added_at,
    so.last_login
  FROM public.system_owners so
  WHERE so.user_id = check_user_id AND so.is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to add new system owner
CREATE OR REPLACE FUNCTION public.add_system_owner(
  target_email VARCHAR(255),
  target_name VARCHAR(255),
  owner_role VARCHAR(50) DEFAULT 'co_owner',
  owner_permissions JSONB DEFAULT '["billing", "users", "analytics"]'::jsonb,
  notes_param TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  target_user_id UUID;
  new_owner_id UUID;
BEGIN
  -- Only system owners can add new owners
  IF NOT public.is_system_owner() THEN
    RAISE EXCEPTION 'Access denied. System owner privileges required.';
  END IF;

  -- Get user_id from email (must be existing user)
  SELECT id INTO target_user_id
  FROM auth.users
  WHERE email = target_email;

  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'User with email % not found. User must register first.', target_email;
  END IF;

  -- Check if already a system owner
  IF public.is_system_owner(target_user_id) THEN
    RAISE EXCEPTION 'User % is already a system owner.', target_email;
  END IF;

  -- Add new system owner
  INSERT INTO public.system_owners (
    user_id,
    email,
    name,
    role,
    permissions,
    added_by,
    notes
  ) VALUES (
    target_user_id,
    target_email,
    target_name,
    owner_role,
    owner_permissions,
    auth.uid(),
    notes_param
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
    'system_owner_added',
    'system_owner',
    new_owner_id,
    jsonb_build_object(
      'target_email', target_email,
      'role', owner_role,
      'permissions', owner_permissions
    ),
    NOW()
  );

  RETURN new_owner_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to remove system owner
CREATE OR REPLACE FUNCTION public.remove_system_owner(
  target_email VARCHAR(255),
  reason TEXT DEFAULT 'Removed by system owner'
)
RETURNS BOOLEAN AS $$
DECLARE
  target_user_id UUID;
  target_owner_id UUID;
BEGIN
  -- Only system owners can remove owners
  IF NOT public.is_system_owner() THEN
    RAISE EXCEPTION 'Access denied. System owner privileges required.';
  END IF;

  -- Get user_id from email
  SELECT id INTO target_user_id
  FROM auth.users
  WHERE email = target_email;

  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'User with email % not found.', target_email;
  END IF;

  -- Cannot remove yourself
  IF target_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Cannot remove yourself as system owner.';
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
    notes = COALESCE(notes || E'\n', '') || 'Removed: ' || reason
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
      'reason', reason
    ),
    NOW()
  );

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update system owner permissions
CREATE OR REPLACE FUNCTION public.update_system_owner_permissions(
  target_email VARCHAR(255),
  new_permissions JSONB,
  new_role VARCHAR(50) DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  target_user_id UUID;
BEGIN
  -- Only system owners can update permissions
  IF NOT public.is_system_owner() THEN
    RAISE EXCEPTION 'Access denied. System owner privileges required.';
  END IF;

  -- Get user_id from email
  SELECT id INTO target_user_id
  FROM auth.users
  WHERE email = target_email;

  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'User with email % not found.', target_email;
  END IF;

  -- Update permissions
  UPDATE public.system_owners
  SET 
    permissions = new_permissions,
    role = COALESCE(new_role, role),
    updated_at = NOW()
  WHERE user_id = target_user_id AND is_active = true;

  -- Log the action
  INSERT INTO public.audit_logs (
    user_id,
    action,
    resource_type,
    metadata,
    timestamp
  ) VALUES (
    auth.uid(),
    'system_owner_permissions_updated',
    'system_owner',
    jsonb_build_object(
      'target_email', target_email,
      'new_permissions', new_permissions,
      'new_role', new_role
    ),
    NOW()
  );

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update business schema RLS policies to use system_owners table
-- Update existing policies to use the new is_system_owner function

-- Drop old policies that used hardcoded email
DROP POLICY IF EXISTS "Owner can manage subscriptions" ON public.customer_subscriptions;
DROP POLICY IF EXISTS "Owner can manage support tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Owner can view business metrics" ON public.business_metrics;
DROP POLICY IF EXISTS "Owner can view business events" ON public.business_events;

-- Create new policies using system_owners
CREATE POLICY "System owners can manage subscriptions" ON public.customer_subscriptions
  FOR ALL USING (public.is_system_owner());

CREATE POLICY "System owners can manage support tickets" ON public.support_tickets
  FOR ALL USING (public.is_system_owner());

CREATE POLICY "System owners can view business metrics" ON public.business_metrics
  FOR SELECT USING (public.is_system_owner());

CREATE POLICY "System owners can view business events" ON public.business_events
  FOR SELECT USING (public.is_system_owner());

-- Update the MRR calculation function to use system_owners
CREATE OR REPLACE FUNCTION public.calculate_current_mrr()
RETURNS DECIMAL(10,2) AS $$
DECLARE
  total_mrr DECIMAL(10,2);
BEGIN
  -- Only system owners can call this
  IF NOT public.is_system_owner() THEN
    RAISE EXCEPTION 'Access denied. System owner privileges required.';
  END IF;

  SELECT COALESCE(SUM(
    CASE 
      WHEN billing_cycle = 'monthly' THEN monthly_amount
      WHEN billing_cycle = 'annual' THEN annual_amount / 12
      ELSE 0
    END
  ), 0) INTO total_mrr
  FROM public.customer_subscriptions
  WHERE status = 'active';
  
  RETURN total_mrr;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.is_system_owner(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_system_owner_details(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.add_system_owner(VARCHAR(255), VARCHAR(255), VARCHAR(50), JSONB, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.remove_system_owner(VARCHAR(255), TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_system_owner_permissions(VARCHAR(255), JSONB, VARCHAR(50)) TO authenticated;

-- Add the first system owner (you)
-- Replace with your actual email
INSERT INTO public.system_owners (user_id, email, name, role, permissions, notes)
SELECT 
  id as user_id,
  email,
  COALESCE(raw_user_meta_data->>'name', email) as name,
  'owner' as role,
  '["full_access", "billing", "users", "analytics", "settings", "owner_management"]'::jsonb as permissions,
  'Initial system owner' as notes
FROM auth.users 
WHERE email = 'dareogunewu@gmail.com'  -- Change this to your email
ON CONFLICT (user_id) DO UPDATE SET
  is_active = true,
  role = 'owner',
  permissions = '["full_access", "billing", "users", "analytics", "settings", "owner_management"]'::jsonb,
  updated_at = NOW();

-- Trigger to update last_login when owner accesses system
CREATE OR REPLACE FUNCTION public.update_system_owner_last_login()
RETURNS TRIGGER AS $$
BEGIN
  IF public.is_system_owner() THEN
    UPDATE public.system_owners
    SET last_login = NOW()
    WHERE user_id = auth.uid();
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'System owners management setup completed!';
  RAISE NOTICE 'Table created: system_owners';
  RAISE NOTICE 'Functions created: is_system_owner, add_system_owner, remove_system_owner';
  RAISE NOTICE 'Multi-owner support enabled with role-based permissions.';
  RAISE NOTICE 'First system owner added (update email if needed).';
END $$;