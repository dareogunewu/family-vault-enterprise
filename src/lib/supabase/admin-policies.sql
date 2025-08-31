-- Admin Console Database Policies
-- Run this to enable admin access to all tables

-- Create admin_users table to track who has admin privileges
CREATE TABLE IF NOT EXISTS public.admin_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  email VARCHAR(255) NOT NULL,
  granted_by UUID REFERENCES auth.users(id),
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  permissions JSONB DEFAULT '["read", "write", "delete", "user_management", "session_management"]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for admin_users
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Only admins can manage admin_users table
CREATE POLICY "Admins can manage admin_users" ON public.admin_users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.admin_users 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- Function to check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE user_id = auth.uid() AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is admin or owns the resource
CREATE OR REPLACE FUNCTION public.is_admin_or_owner(resource_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN auth.uid() = resource_user_id OR public.is_admin();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update existing policies to allow admin access

-- Users table - allow admin to view all users
CREATE POLICY "Admins can view all users" ON public.users
  FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can update all users" ON public.users
  FOR UPDATE USING (public.is_admin());

-- Organizations - allow admin to view/manage all organizations  
CREATE POLICY "Admins can view all organizations" ON public.organizations
  FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can manage all organizations" ON public.organizations
  FOR ALL USING (public.is_admin());

-- Organization users - allow admin access
CREATE POLICY "Admins can view all organization users" ON public.organization_users
  FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can manage all organization users" ON public.organization_users
  FOR ALL USING (public.is_admin());

-- Ciphers - allow admin to view all (for security monitoring)
CREATE POLICY "Admins can view all ciphers" ON public.ciphers
  FOR SELECT USING (public.is_admin());

-- Folders - allow admin access
CREATE POLICY "Admins can view all folders" ON public.folders
  FOR SELECT USING (public.is_admin());

-- Audit logs - allow admin to view all
CREATE POLICY "Admins can view all audit logs" ON public.audit_logs
  FOR SELECT USING (public.is_admin());

-- User sessions - allow admin to view and terminate all sessions
CREATE POLICY "Admins can view all sessions" ON public.user_sessions
  FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can terminate any session" ON public.user_sessions
  FOR UPDATE USING (public.is_admin());

-- Emergency access - allow admin to view all
CREATE POLICY "Admins can view all emergency access" ON public.emergency_access
  FOR SELECT USING (public.is_admin());

-- Create admin-specific functions

-- Function to get user statistics
CREATE OR REPLACE FUNCTION public.get_admin_user_stats()
RETURNS TABLE(
  total_users BIGINT,
  active_users BIGINT,
  verified_users BIGINT,
  users_with_2fa BIGINT,
  recent_logins BIGINT
) AS $$
BEGIN
  -- Only allow admins to call this function
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;

  RETURN QUERY
  SELECT 
    COUNT(*) as total_users,
    COUNT(*) FILTER (WHERE is_active = true) as active_users,
    COUNT(*) FILTER (WHERE email_verified = true) as verified_users,
    COUNT(*) FILTER (WHERE two_factor_enabled = true) as users_with_2fa,
    COUNT(*) FILTER (WHERE last_login > NOW() - INTERVAL '24 hours') as recent_logins
  FROM public.users;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get organization statistics
CREATE OR REPLACE FUNCTION public.get_admin_org_stats()
RETURNS TABLE(
  total_orgs BIGINT,
  family_plan_orgs BIGINT,
  enterprise_plan_orgs BIGINT,
  avg_members_per_org NUMERIC,
  total_org_members BIGINT
) AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;

  RETURN QUERY
  SELECT 
    COUNT(*) as total_orgs,
    COUNT(*) FILTER (WHERE plan_type = 'family') as family_plan_orgs,
    COUNT(*) FILTER (WHERE plan_type = 'enterprise') as enterprise_plan_orgs,
    ROUND(AVG(
      (SELECT COUNT(*) FROM public.organization_users ou WHERE ou.organization_id = o.id)
    ), 2) as avg_members_per_org,
    (SELECT COUNT(*) FROM public.organization_users WHERE status = 'active') as total_org_members
  FROM public.organizations o;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to disable user account (admin only)
CREATE OR REPLACE FUNCTION public.admin_disable_user(target_user_id UUID, reason TEXT DEFAULT 'Admin disabled')
RETURNS BOOLEAN AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;

  -- Disable user
  UPDATE public.users 
  SET is_active = false, updated_at = NOW()
  WHERE id = target_user_id;

  -- Terminate all user sessions
  UPDATE public.user_sessions
  SET 
    is_active = false,
    terminated_at = NOW(),
    termination_reason = 'admin'
  WHERE user_id = target_user_id AND is_active = true;

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
    'admin_disable_user',
    'user',
    target_user_id,
    jsonb_build_object('reason', reason),
    NOW()
  );

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to enable user account (admin only)
CREATE OR REPLACE FUNCTION public.admin_enable_user(target_user_id UUID, reason TEXT DEFAULT 'Admin enabled')
RETURNS BOOLEAN AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;

  UPDATE public.users 
  SET is_active = true, updated_at = NOW()
  WHERE id = target_user_id;

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
    'admin_enable_user',
    'user',
    target_user_id,
    jsonb_build_object('reason', reason),
    NOW()
  );

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin_or_owner(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_user_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_org_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_disable_user(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_enable_user(UUID, TEXT) TO authenticated;

-- Insert yourself as the first admin (update the email to match your account)
-- Note: Change this email to your actual email address
INSERT INTO public.admin_users (user_id, email, granted_by, permissions)
SELECT 
  id as user_id,
  email,
  id as granted_by,  -- Self-granted for first admin
  '["read", "write", "delete", "user_management", "session_management", "admin_management"]'::jsonb
FROM auth.users 
WHERE email = 'dareogunewu@gmail.com'  -- Change this to your email
ON CONFLICT (user_id) DO UPDATE SET
  is_active = true,
  permissions = '["read", "write", "delete", "user_management", "session_management", "admin_management"]'::jsonb;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Admin console setup completed!';
  RAISE NOTICE 'Tables created: admin_users';
  RAISE NOTICE 'Admin functions created and permissions granted.';
  RAISE NOTICE 'Admin policies added to all tables.';
  RAISE NOTICE 'First admin user configured (update email if needed).';
END $$;