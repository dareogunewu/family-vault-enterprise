# Supabase Configuration Guide

## Fix Email Confirmation Redirect

The email confirmation currently redirects to `localhost:3000`. To fix this:

### 1. Update Site URL in Supabase

Go to: https://supabase.com/dashboard/project/anrhqraxiqgpxraeglln/auth/url-configuration

**Set these URLs:**

- **Site URL:** `https://family-vault-enterprise-8eghgtk7o-dareogunewus-projects.vercel.app`
- **Redirect URLs:** 
  - `https://family-vault-enterprise-8eghgtk7o-dareogunewus-projects.vercel.app/**`
  - `https://family-vault-enterprise-8eghgtk7o-dareogunewus-projects.vercel.app/auth/callback`

### 2. Configure OAuth Redirect (if using Google signin)

**Allowed redirect URLs:**
- `https://family-vault-enterprise-8eghgtk7o-dareogunewus-projects.vercel.app/auth/callback`

### 3. Email Template Configuration

Go to: https://supabase.com/dashboard/project/anrhqraxiqgpxraeglln/auth/templates

**Confirm signup template** should use:
```
{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=signup&redirect_to={{ .SiteURL }}
```

### 4. Required Environment Variables

Make sure these are set in Vercel:

```
NEXT_PUBLIC_SUPABASE_URL=https://anrhqraxiqgpxraeglln.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

After making these changes:
1. Email confirmations will redirect to your live app (not localhost)
2. Registration will work properly
3. OAuth flows will work correctly