# Supabase Configuration Guide

## URGENT: Update Environment Variables

Your current Supabase project URL is: `https://ddkghjvvlihtkdfqbifi.supabase.co`

## Fix Authentication Issues

### 1. Update Environment Variables in Vercel

Go to: https://vercel.com/dareogunewus-projects/family-vault-enterprise/settings/environment-variables

**Update these environment variables:**

```
NEXT_PUBLIC_SUPABASE_URL=https://ddkghjvvlihtkdfqbifi.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-from-ddkghjvvlihtkdfqbifi-project
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-from-ddkghjvvlihtkdfqbifi-project
```

### 2. Update Site URL in Supabase

Go to: https://supabase.com/dashboard/project/ddkghjvvlihtkdfqbifi/auth/url-configuration

**Set these URLs:**

- **Site URL:** `https://family-vault-enterprise-8eghgtk7o-dareogunewus-projects.vercel.app`
- **Redirect URLs:** 
  - `https://family-vault-enterprise-8eghgtk7o-dareogunewus-projects.vercel.app/**`
  - `https://family-vault-enterprise-8eghgtk7o-dareogunewus-projects.vercel.app/auth/callback`

### 3. Configure OAuth Redirect (if using Google signin)

**Allowed redirect URLs:**
- `https://family-vault-enterprise-8eghgtk7o-dareogunewus-projects.vercel.app/auth/callback`

### 4. Email Template Configuration

Go to: https://supabase.com/dashboard/project/ddkghjvvlihtkdfqbifi/auth/templates

**Confirm signup template** should use:
```
{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=signup&redirect_to={{ .SiteURL }}
```

After making these changes:
1. Email confirmations will redirect to your live app (not localhost)
2. Registration will work properly
3. OAuth flows will work correctly