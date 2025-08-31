-- Session Management Enhancement for 30-minute timeout (FIXED VERSION)
-- Add this to your existing database schema

-- Session tracking table for enhanced security and timeout management
CREATE TABLE IF NOT EXISTS public.user_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  session_token TEXT UNIQUE NOT NULL,
  ip_address INET,
  user_agent TEXT,
  device_fingerprint TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  terminated_at TIMESTAMP WITH TIME ZONE,
  termination_reason VARCHAR(50), -- 'timeout', 'logout', 'security', 'admin'
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Enable Row Level Security
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- Users can only manage their own sessions
CREATE POLICY "Users can manage own sessions" ON public.user_sessions
  FOR ALL USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON public.user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON public.user_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_user_sessions_last_activity ON public.user_sessions(last_activity);

-- Function to cleanup expired sessions
CREATE OR REPLACE FUNCTION public.cleanup_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
  cleaned_count INTEGER;
BEGIN
  UPDATE public.user_sessions 
  SET 
    is_active = false,
    terminated_at = NOW(),
    termination_reason = 'timeout'
  WHERE 
    is_active = true 
    AND expires_at < NOW();
    
  GET DIAGNOSTICS cleaned_count = ROW_COUNT;
  
  -- Log cleanup activity
  INSERT INTO public.audit_logs (
    action, 
    resource_type, 
    metadata, 
    timestamp
  ) VALUES (
    'session_cleanup',
    'session',
    jsonb_build_object('cleaned_sessions', cleaned_count),
    NOW()
  );
  
  RETURN cleaned_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to extend session activity (FIXED)
CREATE OR REPLACE FUNCTION public.extend_session_activity(session_token_param TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  update_count INTEGER;
BEGIN
  UPDATE public.user_sessions 
  SET 
    last_activity = NOW(),
    expires_at = NOW() + INTERVAL '30 minutes'
  WHERE 
    session_token = session_token_param 
    AND is_active = true 
    AND expires_at > NOW()
    AND user_id = auth.uid();
    
  GET DIAGNOSTICS update_count = ROW_COUNT;
  
  IF update_count > 0 THEN
    -- Log session extension
    INSERT INTO public.audit_logs (
      user_id,
      action, 
      resource_type, 
      metadata, 
      timestamp
    ) VALUES (
      auth.uid(),
      'session_extended',
      'session',
      jsonb_build_object('session_token', left(session_token_param, 8) || '...'),
      NOW()
    );
    
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to terminate session (FIXED)
CREATE OR REPLACE FUNCTION public.terminate_session(session_token_param TEXT, reason VARCHAR(50) DEFAULT 'logout')
RETURNS BOOLEAN AS $$
DECLARE
  update_count INTEGER;
BEGIN
  UPDATE public.user_sessions 
  SET 
    is_active = false,
    terminated_at = NOW(),
    termination_reason = reason
  WHERE 
    session_token = session_token_param 
    AND is_active = true
    AND user_id = auth.uid();
    
  GET DIAGNOSTICS update_count = ROW_COUNT;
  
  IF update_count > 0 THEN
    -- Log session termination
    INSERT INTO public.audit_logs (
      user_id,
      action, 
      resource_type, 
      metadata, 
      timestamp
    ) VALUES (
      auth.uid(),
      'session_terminated',
      'session',
      jsonb_build_object(
        'session_token', left(session_token_param, 8) || '...',
        'reason', reason
      ),
      NOW()
    );
    
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to log session creation
CREATE OR REPLACE FUNCTION public.log_session_creation()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.audit_logs (
    user_id,
    action, 
    resource_type, 
    resource_id,
    ip_address,
    user_agent,
    metadata, 
    timestamp
  ) VALUES (
    NEW.user_id,
    'session_created',
    'session',
    NEW.id,
    NEW.ip_address,
    NEW.user_agent,
    jsonb_build_object(
      'session_token', left(NEW.session_token, 8) || '...',
      'expires_at', NEW.expires_at
    ),
    NOW()
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS user_sessions_created ON public.user_sessions;
CREATE TRIGGER user_sessions_created AFTER INSERT ON public.user_sessions
  FOR EACH ROW EXECUTE FUNCTION public.log_session_creation();

-- Create a view for active sessions (useful for admin monitoring)
CREATE OR REPLACE VIEW public.active_sessions AS
SELECT 
  us.id,
  us.user_id,
  us.ip_address,
  us.created_at,
  us.last_activity,
  us.expires_at,
  CASE 
    WHEN us.expires_at < NOW() THEN 'expired'
    WHEN us.last_activity < NOW() - INTERVAL '5 minutes' THEN 'idle'
    ELSE 'active'
  END as session_status,
  EXTRACT(EPOCH FROM (us.expires_at - NOW())) / 60 as minutes_until_expiry
FROM public.user_sessions us
WHERE us.is_active = true
ORDER BY us.last_activity DESC;

-- Function to get session cleanup stats
CREATE OR REPLACE FUNCTION public.get_session_cleanup_stats()
RETURNS TABLE(
  total_sessions BIGINT,
  active_sessions BIGINT,
  expired_sessions BIGINT,
  last_cleanup TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_sessions,
    COUNT(*) FILTER (WHERE is_active = true AND expires_at > NOW()) as active_sessions,
    COUNT(*) FILTER (WHERE is_active = true AND expires_at <= NOW()) as expired_sessions,
    MAX(terminated_at) as last_cleanup
  FROM public.user_sessions;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions for the functions
GRANT EXECUTE ON FUNCTION public.cleanup_expired_sessions() TO authenticated;
GRANT EXECUTE ON FUNCTION public.extend_session_activity(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.terminate_session(TEXT, VARCHAR(50)) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_session_cleanup_stats() TO authenticated;

-- Grant select on the view
GRANT SELECT ON public.active_sessions TO authenticated;

-- Test the setup
DO $$
BEGIN
  RAISE NOTICE 'Session management setup completed successfully!';
  RAISE NOTICE 'Tables created: user_sessions';
  RAISE NOTICE 'Functions created: cleanup_expired_sessions, extend_session_activity, terminate_session, get_session_cleanup_stats';
  RAISE NOTICE 'View created: active_sessions';
  RAISE NOTICE 'All policies and permissions configured.';
END $$;