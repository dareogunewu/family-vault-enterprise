-- Business/SaaS Owner Database Schema
-- Run this to track customers, subscriptions, revenue, and business metrics

-- Customer/Organization billing and business data
CREATE TABLE IF NOT EXISTS public.customer_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  plan_type VARCHAR(50) NOT NULL CHECK (plan_type IN ('free', 'family', 'enterprise', 'custom')),
  status VARCHAR(20) NOT NULL CHECK (status IN ('active', 'inactive', 'trialing', 'past_due', 'canceled', 'suspended')),
  billing_email VARCHAR(255) NOT NULL,
  
  -- Pricing
  monthly_amount DECIMAL(10,2) DEFAULT 0,
  annual_amount DECIMAL(10,2) DEFAULT 0,
  currency VARCHAR(3) DEFAULT 'USD',
  
  -- Billing cycle
  billing_cycle VARCHAR(20) DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'annual')),
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  
  -- Trial information
  trial_start TIMESTAMP WITH TIME ZONE,
  trial_end TIMESTAMP WITH TIME ZONE,
  
  -- Limits and usage
  max_members INTEGER DEFAULT 6,
  storage_limit_gb INTEGER DEFAULT 5,
  current_members INTEGER DEFAULT 0,
  current_storage_mb BIGINT DEFAULT 0,
  
  -- External integration IDs (Stripe, etc.)
  stripe_customer_id VARCHAR(255),
  stripe_subscription_id VARCHAR(255),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  canceled_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Customer support tickets
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- Ticket details
  subject VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  category VARCHAR(50) NOT NULL CHECK (category IN ('bug', 'feature_request', 'billing', 'technical_support', 'account', 'security')),
  
  -- Assignment
  assigned_to VARCHAR(255), -- Support team member
  
  -- Communication
  customer_email VARCHAR(255) NOT NULL,
  customer_name VARCHAR(255),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  first_response_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Support ticket messages/replies
CREATE TABLE IF NOT EXISTS public.support_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id UUID REFERENCES public.support_tickets(id) ON DELETE CASCADE NOT NULL,
  
  -- Message details
  sender_type VARCHAR(20) NOT NULL CHECK (sender_type IN ('customer', 'support', 'system')),
  sender_name VARCHAR(255),
  sender_email VARCHAR(255),
  
  message TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT false, -- Internal notes vs customer-visible
  
  -- Attachments
  attachments JSONB DEFAULT '[]'::jsonb,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Business metrics and KPIs tracking
CREATE TABLE IF NOT EXISTS public.business_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Date for the metric (daily snapshots)
  metric_date DATE NOT NULL,
  
  -- Revenue metrics
  mrr DECIMAL(10,2) DEFAULT 0, -- Monthly Recurring Revenue
  arr DECIMAL(10,2) DEFAULT 0, -- Annual Recurring Revenue
  new_mrr DECIMAL(10,2) DEFAULT 0, -- New MRR from new customers
  expansion_mrr DECIMAL(10,2) DEFAULT 0, -- MRR from upgrades
  contraction_mrr DECIMAL(10,2) DEFAULT 0, -- Lost MRR from downgrades
  churn_mrr DECIMAL(10,2) DEFAULT 0, -- Lost MRR from churned customers
  
  -- Customer metrics
  total_customers INTEGER DEFAULT 0,
  new_customers INTEGER DEFAULT 0,
  churned_customers INTEGER DEFAULT 0,
  active_customers INTEGER DEFAULT 0,
  trial_customers INTEGER DEFAULT 0,
  
  -- Usage metrics
  total_users INTEGER DEFAULT 0,
  active_users_24h INTEGER DEFAULT 0,
  active_users_30d INTEGER DEFAULT 0,
  total_organizations INTEGER DEFAULT 0,
  
  -- System metrics
  api_requests_24h BIGINT DEFAULT 0,
  storage_used_gb DECIMAL(10,2) DEFAULT 0,
  database_size_mb DECIMAL(10,2) DEFAULT 0,
  uptime_percentage DECIMAL(5,2) DEFAULT 99.99,
  
  -- Support metrics
  open_tickets INTEGER DEFAULT 0,
  resolved_tickets INTEGER DEFAULT 0,
  avg_response_time_hours DECIMAL(6,2),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one record per date
  UNIQUE(metric_date)
);

-- System events and business intelligence
CREATE TABLE IF NOT EXISTS public.business_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Event details
  event_type VARCHAR(50) NOT NULL, -- 'subscription_created', 'customer_churned', 'upgrade', etc.
  event_category VARCHAR(30) NOT NULL CHECK (event_category IN ('revenue', 'customer', 'system', 'support', 'security')),
  
  -- Related entities
  organization_id UUID REFERENCES public.organizations(id),
  user_id UUID REFERENCES public.users(id),
  subscription_id UUID REFERENCES public.customer_subscriptions(id),
  
  -- Event data
  event_data JSONB NOT NULL,
  revenue_impact DECIMAL(10,2), -- Positive or negative revenue impact
  
  -- Metadata
  source VARCHAR(50), -- 'webhook', 'manual', 'system', etc.
  ip_address INET,
  user_agent TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on business tables
ALTER TABLE public.customer_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies (only system owner can access business data)
CREATE POLICY "Owner can manage subscriptions" ON public.customer_subscriptions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND email = 'dareogunewu@gmail.com' -- Update to your email
    )
  );

CREATE POLICY "Owner can manage support tickets" ON public.support_tickets
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND email = 'dareogunewu@gmail.com' -- Update to your email
    )
  );

CREATE POLICY "Owner can view business metrics" ON public.business_metrics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND email = 'dareogunewu@gmail.com' -- Update to your email
    )
  );

CREATE POLICY "Owner can view business events" ON public.business_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND email = 'dareogunewu@gmail.com' -- Update to your email
    )
  );

-- Organization members can create support tickets for their organization
CREATE POLICY "Organization members can create support tickets" ON public.support_tickets
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.organization_users 
      WHERE organization_id = support_tickets.organization_id 
      AND user_id = auth.uid() 
      AND status = 'active'
    )
    OR 
    EXISTS (
      SELECT 1 FROM public.organizations 
      WHERE id = support_tickets.organization_id 
      AND owner_id = auth.uid()
    )
  );

-- Organization members can view their own support tickets
CREATE POLICY "Organization members can view own tickets" ON public.support_tickets
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.organization_users 
      WHERE organization_id = support_tickets.organization_id 
      AND user_id = auth.uid() 
      AND status = 'active'
    )
    OR 
    EXISTS (
      SELECT 1 FROM public.organizations 
      WHERE id = support_tickets.organization_id 
      AND owner_id = auth.uid()
    )
  );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_customer_subscriptions_org_id ON public.customer_subscriptions(organization_id);
CREATE INDEX IF NOT EXISTS idx_customer_subscriptions_status ON public.customer_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_customer_subscriptions_stripe ON public.customer_subscriptions(stripe_customer_id);

CREATE INDEX IF NOT EXISTS idx_support_tickets_org_id ON public.support_tickets(organization_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON public.support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_created_at ON public.support_tickets(created_at);

CREATE INDEX IF NOT EXISTS idx_business_metrics_date ON public.business_metrics(metric_date);
CREATE INDEX IF NOT EXISTS idx_business_events_type ON public.business_events(event_type);
CREATE INDEX IF NOT EXISTS idx_business_events_category ON public.business_events(event_category);
CREATE INDEX IF NOT EXISTS idx_business_events_created_at ON public.business_events(created_at);

-- Functions for business analytics

-- Function to calculate current MRR
CREATE OR REPLACE FUNCTION public.calculate_current_mrr()
RETURNS DECIMAL(10,2) AS $$
DECLARE
  total_mrr DECIMAL(10,2);
BEGIN
  -- Only system owner can call this
  IF NOT EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() AND email = 'dareogunewu@gmail.com' -- Update to your email
  ) THEN
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

-- Function to get customer health score
CREATE OR REPLACE FUNCTION public.get_customer_health_score(org_id UUID)
RETURNS INTEGER AS $$
DECLARE
  health_score INTEGER := 100;
  last_login_days INTEGER;
  support_tickets_count INTEGER;
  usage_ratio DECIMAL;
BEGIN
  -- Only system owner can call this
  IF NOT EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() AND email = 'dareogunewu@gmail.com' -- Update to your email
  ) THEN
    RAISE EXCEPTION 'Access denied. System owner privileges required.';
  END IF;

  -- Check last login (reduce score if no recent activity)
  SELECT EXTRACT(DAYS FROM NOW() - MAX(u.last_login))::INTEGER
  INTO last_login_days
  FROM public.users u
  JOIN public.organization_users ou ON u.id = ou.user_id
  WHERE ou.organization_id = org_id;
  
  IF last_login_days > 30 THEN
    health_score := health_score - 20;
  ELSIF last_login_days > 7 THEN
    health_score := health_score - 10;
  END IF;
  
  -- Check support tickets (reduce score for many tickets)
  SELECT COUNT(*)::INTEGER
  INTO support_tickets_count
  FROM public.support_tickets
  WHERE organization_id = org_id 
  AND status IN ('open', 'in_progress')
  AND created_at > NOW() - INTERVAL '30 days';
  
  health_score := health_score - (support_tickets_count * 5);
  
  -- Ensure score stays within bounds
  health_score := GREATEST(0, LEAST(100, health_score));
  
  RETURN health_score;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to record business events
CREATE OR REPLACE FUNCTION public.record_business_event(
  event_type_param VARCHAR(50),
  event_category_param VARCHAR(30),
  event_data_param JSONB,
  revenue_impact_param DECIMAL(10,2) DEFAULT NULL,
  org_id_param UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  event_id UUID;
BEGIN
  INSERT INTO public.business_events (
    event_type,
    event_category,
    organization_id,
    event_data,
    revenue_impact,
    source
  ) VALUES (
    event_type_param,
    event_category_param,
    org_id_param,
    event_data_param,
    revenue_impact_param,
    'system'
  ) RETURNING id INTO event_id;
  
  RETURN event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.calculate_current_mrr() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_customer_health_score(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_business_event(VARCHAR(50), VARCHAR(30), JSONB, DECIMAL(10,2), UUID) TO authenticated;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Business/SaaS schema setup completed!';
  RAISE NOTICE 'Tables created: customer_subscriptions, support_tickets, support_messages, business_metrics, business_events';
  RAISE NOTICE 'Business analytics functions created and permissions granted.';
  RAISE NOTICE 'Owner-only access policies configured.';
  RAISE NOTICE 'Ready for SaaS business management!';
END $$;