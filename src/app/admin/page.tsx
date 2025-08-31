'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { useSession } from '@/hooks/useSession';
import { SessionWarning } from '@/components/SessionWarning';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Shield, 
  Users, 
  Activity, 
  Database, 
  Settings,
  AlertTriangle,
  Clock,
  Eye,
  UserX,
  RefreshCw,
  BarChart3,
  FileText
} from 'lucide-react';
import Link from 'next/link';

interface User {
  id: string;
  email: string;
  name: string;
  created_at: string;
  last_login: string | null;
  is_active: boolean;
  email_verified: boolean;
  two_factor_enabled: boolean;
}

interface ActiveSession {
  id: string;
  user_id: string;
  ip_address: string;
  created_at: string;
  last_activity: string;
  expires_at: string;
  session_status: string;
  minutes_until_expiry: number;
}

interface AuditLog {
  id: number;
  user_id: string;
  action: string;
  resource_type: string;
  ip_address: string;
  timestamp: string;
  metadata: any;
}

interface Organization {
  id: string;
  name: string;
  owner_id: string;
  plan_type: string;
  max_members: number;
  created_at: string;
  member_count?: number;
}

export default function AdminDashboard() {
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Data states
  const [users, setUsers] = useState<User[]>([]);
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalSessions: 0,
    expiredSessions: 0,
    totalOrganizations: 0,
    totalAuditLogs: 0
  });

  const router = useRouter();
  const { isAuthenticated, isLoading: sessionLoading, showIdleWarning, timeUntilExpiry, extendSession, signOut } = useSession();

  useEffect(() => {
    const checkAdminAccess = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error || !user) {
          router.push('/auth/login');
          return;
        }

        setUser(user);

        // Check if user is admin (for now, using email or you can add admin table)
        const adminEmails = ['dareogunewu@gmail.com', 'admin@familyvault.com']; // Update with your admin emails
        const userIsAdmin = adminEmails.includes(user.email || '');
        
        if (!userIsAdmin) {
          router.push('/dashboard');
          return;
        }

        setIsAdmin(true);
        await loadAdminData();
      } catch (error) {
        console.error('Admin access check error:', error);
        router.push('/auth/login');
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated) {
      checkAdminAccess();
    }
  }, [isAuthenticated, router]);

  const loadAdminData = async () => {
    try {
      await Promise.all([
        loadUsers(),
        loadActiveSessions(),
        loadAuditLogs(),
        loadOrganizations(),
        loadStats()
      ]);
    } catch (error) {
      console.error('Error loading admin data:', error);
    }
  };

  const loadUsers = async () => {
    // Note: This requires service role key or admin RLS policies
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (!error && data) {
      setUsers(data);
    }
  };

  const loadActiveSessions = async () => {
    const { data, error } = await supabase
      .from('active_sessions')
      .select('*')
      .limit(100);

    if (!error && data) {
      setActiveSessions(data);
    }
  };

  const loadAuditLogs = async () => {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(100);

    if (!error && data) {
      setAuditLogs(data);
    }
  };

  const loadOrganizations = async () => {
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setOrganizations(data);
    }
  };

  const loadStats = async () => {
    try {
      const { data: sessionStats } = await supabase.rpc('get_session_cleanup_stats');
      const { data: userCount } = await supabase.from('users').select('id', { count: 'exact', head: true });
      const { data: orgCount } = await supabase.from('organizations').select('id', { count: 'exact', head: true });
      const { data: auditCount } = await supabase.from('audit_logs').select('id', { count: 'exact', head: true });

      setStats({
        totalUsers: userCount?.length || 0,
        activeUsers: activeSessions.filter(s => s.session_status === 'active').length,
        totalSessions: sessionStats?.[0]?.total_sessions || 0,
        expiredSessions: sessionStats?.[0]?.expired_sessions || 0,
        totalOrganizations: orgCount?.length || 0,
        totalAuditLogs: auditCount?.length || 0
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const terminateSession = async (sessionId: string) => {
    try {
      const { error } = await supabase
        .from('user_sessions')
        .update({ 
          is_active: false, 
          terminated_at: new Date().toISOString(),
          termination_reason: 'admin' 
        })
        .eq('id', sessionId);

      if (!error) {
        await loadActiveSessions();
      }
    } catch (error) {
      console.error('Error terminating session:', error);
    }
  };

  const cleanupExpiredSessions = async () => {
    try {
      const { data } = await supabase.rpc('cleanup_expired_sessions');
      await loadActiveSessions();
      await loadStats();
    } catch (error) {
      console.error('Error cleaning up sessions:', error);
    }
  };

  if (sessionLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Alert className="max-w-md">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>Access denied. Admin privileges required.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <>
      {showIdleWarning && timeUntilExpiry && (
        <SessionWarning
          timeUntilExpiry={timeUntilExpiry}
          onExtendSession={extendSession}
          onSignOut={signOut}
        />
      )}
      
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-lg shadow-sm border-b border-gray-200/50 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <div className="icon-button bg-gradient-to-r from-red-500 to-orange-600 mr-3">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <h1 className="text-xl font-semibold text-gray-900">Admin Console</h1>
              </div>
              <div className="flex items-center space-x-4">
                <Link href="/dashboard">
                  <Button variant="outline" size="sm">Back to Dashboard</Button>
                </Link>
                <Button variant="outline" size="sm" onClick={signOut}>
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Welcome Section */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
            <p className="text-lg text-gray-600">System administration and monitoring</p>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="flex items-center p-6">
                <div className="icon-button bg-blue-50">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
                  <p className="text-sm text-gray-600">Total Users</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex items-center p-6">
                <div className="icon-button bg-green-50">
                  <Activity className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-2xl font-bold text-gray-900">{stats.activeUsers}</p>
                  <p className="text-sm text-gray-600">Active Sessions</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex items-center p-6">
                <div className="icon-button bg-purple-50">
                  <Database className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-2xl font-bold text-gray-900">{stats.totalOrganizations}</p>
                  <p className="text-sm text-gray-600">Organizations</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex items-center p-6">
                <div className="icon-button bg-orange-50">
                  <FileText className="h-6 w-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-2xl font-bold text-gray-900">{stats.totalAuditLogs}</p>
                  <p className="text-sm text-gray-600">Audit Logs</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Navigation Tabs */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'overview', name: 'Overview', icon: BarChart3 },
                { id: 'users', name: 'Users', icon: Users },
                { id: 'sessions', name: 'Sessions', icon: Activity },
                { id: 'organizations', name: 'Organizations', icon: Database },
                { id: 'audit', name: 'Audit Logs', icon: FileText }
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center`}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {tab.name}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Tab Content */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>System Status</CardTitle>
                  <CardDescription>Current system health and activity</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Session Health</h4>
                      <p className="text-sm text-gray-600">
                        Active: {activeSessions.filter(s => s.session_status === 'active').length} |
                        Idle: {activeSessions.filter(s => s.session_status === 'idle').length} |
                        Expired: {activeSessions.filter(s => s.session_status === 'expired').length}
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Security</h4>
                      <p className="text-sm text-gray-600">
                        30-minute timeout enforced | 
                        {auditLogs.filter(log => log.action.includes('session')).length} session events logged
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'sessions' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Active Sessions</h2>
                <Button onClick={cleanupExpiredSessions} size="sm">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Cleanup Expired
                </Button>
              </div>
              
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IP Address</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expires In</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {activeSessions.map((session) => (
                          <tr key={session.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {session.user_id.substring(0, 8)}...
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {session.ip_address || 'Unknown'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Badge variant={
                                session.session_status === 'active' ? 'default' :
                                session.session_status === 'idle' ? 'secondary' : 'destructive'
                              }>
                                {session.session_status}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {session.minutes_until_expiry > 0 
                                ? `${Math.floor(session.minutes_until_expiry)}m`
                                : 'Expired'
                              }
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => terminateSession(session.id)}
                              >
                                <UserX className="h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Add other tab content here */}
        </div>
      </div>
    </>
  );
}