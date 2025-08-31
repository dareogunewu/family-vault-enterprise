# Database Setup for Family Vault Enterprise with Session Management

## Step 1: Access Your Supabase Project

Go to your Supabase dashboard:
**https://supabase.com/dashboard/project/ddkghjvvlihtkdfqbifi**

## Step 2: Set Up Environment Variables

Update your `.env.local` file with your actual Supabase credentials:

```bash
# Get these from: Project Settings > API > Project API Keys
NEXT_PUBLIC_SUPABASE_URL=https://ddkghjvvlihtkdfqbifi.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-actual-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-actual-service-role-key
```

## Step 3: Run Database Schema

### Option A: All-in-One Schema (Recommended)
1. Go to **SQL Editor** in your Supabase dashboard
2. Copy and paste the entire contents of `src/lib/supabase/simplified-schema.sql`
3. Click **Run** to create all tables at once

### Option B: Step-by-Step Setup
1. Run `src/lib/supabase/simplified-schema.sql` first
2. Then run `src/lib/supabase/session-management.sql` for session timeout features

## Step 4: Configure Authentication

Go to **Authentication > Settings** in Supabase dashboard:

### Site URL Configuration
```
Site URL: https://your-app-domain.com
Additional Redirect URLs:
- https://your-app-domain.com/auth/callback
- http://localhost:3000/auth/callback (for development)
```

### Email Templates
Go to **Authentication > Email Templates** and ensure the confirmation template uses:
```
{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=signup&redirect_to={{ .SiteURL }}/dashboard
```

## Step 5: Session Management Features

The session management system provides:

### ✅ 30-Minute Automatic Timeout
- Sessions expire after 30 minutes of inactivity
- Middleware enforces timeouts server-side
- Client-side warnings at 25 minutes

### ✅ Session Tracking
- Database table tracks all user sessions
- IP address and user agent logging
- Device fingerprinting capability

### ✅ Security Features
- Automatic cleanup of expired sessions
- Session extension on user activity
- Audit logging for all session events

### ✅ Admin Monitoring
- `active_sessions` view for monitoring
- Session cleanup statistics
- Detailed audit logs

## Step 6: Test the Setup

1. **Start your application:**
   ```bash
   npm run dev
   ```

2. **Test session timeout:**
   - Login to the application
   - Wait 25 minutes to see the idle warning
   - Or modify `SESSION_TIMEOUT_MS` in middleware.ts to 60000 (1 minute) for quick testing

3. **Verify database setup:**
   ```sql
   -- Check if tables exist
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public' 
   ORDER BY table_name;
   
   -- Check session management functions
   SELECT routine_name FROM information_schema.routines 
   WHERE routine_schema = 'public' 
   AND routine_name LIKE '%session%';
   ```

## Step 7: Production Considerations

### Automated Cleanup
For production, set up automated session cleanup:

```sql
-- If your Supabase plan supports pg_cron
SELECT cron.schedule('cleanup-expired-sessions', '*/5 * * * *', 
  'SELECT public.cleanup_expired_sessions();');
```

Or call the cleanup function from your application:
```typescript
// In your app, call this periodically
const { data } = await supabase.rpc('cleanup_expired_sessions');
```

### Monitoring
Monitor session activity:
```sql
-- Check active sessions
SELECT * FROM public.active_sessions;

-- Get cleanup statistics  
SELECT * FROM public.get_session_cleanup_stats();
```

## Troubleshooting

### Common Issues:

1. **Environment variables not found**
   - Ensure `.env.local` is in the project root
   - Restart your development server after adding variables

2. **Database schema errors**
   - Run the simplified schema first
   - Check for foreign key constraint errors
   - Ensure extensions are enabled

3. **Session timeout not working**
   - Check middleware.ts is in the project root
   - Verify the config.matcher is correct
   - Check browser cookies are enabled

4. **RLS Policy errors**
   - Ensure users are authenticated when testing
   - Check auth.uid() returns a valid UUID
   - Verify table policies are created correctly

## Security Notes

- All session data is encrypted in transit and at rest
- RLS policies prevent users from accessing others' sessions
- Audit logs track all session-related activities
- IP address and user agent are logged for security monitoring
- Sessions are automatically cleaned up to prevent database bloat

## Next Steps

After setup:
1. Test the 30-minute session timeout
2. Monitor the audit logs for session activity
3. Consider implementing additional security features like:
   - Device fingerprinting
   - Concurrent session limits
   - Geolocation-based security alerts