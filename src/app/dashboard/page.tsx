'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, Key, FileText, Users, Activity, Settings, CheckCircle, AlertTriangle, User } from 'lucide-react';
import Link from 'next/link';

interface SecurityEvent {
  id: string;
  type: 'login' | 'logout' | 'password_change' | 'document_access' | 'failed_login';
  description: string;
  timestamp: string;
  location?: string;
  device?: string;
  status: 'success' | 'warning' | 'error';
}

export default function DashboardPage() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    passwords: 0,
    documents: 0,
    familyMembers: 1,
    uptime: '99.9%'
  });
  const [recentEvents, setRecentEvents] = useState<SecurityEvent[]>([]);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error || !user) {
          router.push('/auth/login');
          return;
        }

        setUser(user);
        loadUserStats(user.id);
        loadRecentEvents(user.id);
      } catch (error) {
        console.error('Auth check error:', error);
        router.push('/auth/login');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const loadUserStats = (userId: string) => {
    try {
      // Load passwords count
      const passwords = localStorage.getItem(`passwords_${userId}`);
      const passwordCount = passwords ? JSON.parse(passwords).length : 0;

      // Load documents count  
      const documents = localStorage.getItem(`documents_${userId}`);
      const documentCount = documents ? JSON.parse(documents).length : 0;

      setStats({
        passwords: passwordCount,
        documents: documentCount,
        familyMembers: 1, // For now, just the current user
        uptime: '99.9%'
      });
    } catch (error) {
      console.error('Error loading user stats:', error);
    }
  };

  const loadRecentEvents = (userId: string) => {
    try {
      const savedEvents = localStorage.getItem(`security_events_${userId}`);
      if (savedEvents) {
        const events = JSON.parse(savedEvents);
        // Get only the 3 most recent events
        setRecentEvents(events.slice(0, 3));
      } else {
        setRecentEvents([]);
      }
    } catch (error) {
      console.error('Error loading recent events:', error);
      setRecentEvents([]);
    }
  };

  const getEventIcon = (type: string, status: string) => {
    if (status === 'error') return <AlertTriangle className="h-5 w-5 text-red-500" />;
    if (status === 'warning') return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
    
    switch (type) {
      case 'login':
      case 'logout':
        return <User className="h-5 w-5 text-green-600" />;
      case 'password_change':
        return <Key className="h-5 w-5 text-purple-600" />;
      case 'document_access':
        return <FileText className="h-5 w-5 text-blue-600" />;
      default:
        return <CheckCircle className="h-5 w-5 text-green-600" />;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hours ago`;
    return date.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-lg shadow-sm border-b border-gray-200/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center animate-slideInRight">
              <div className="icon-button bg-gradient-to-r from-blue-500 to-purple-600 mr-3">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <h1 className="heading-2 text-gray-900">Family Vault Enterprise</h1>
            </div>
            <div className="flex items-center space-x-4 animate-slideInRight" style={{animationDelay: '0.2s'}}>
              <div className="text-right">
                <p className="caption text-gray-500">Welcome back</p>
                <p className="body-large font-medium text-gray-900">
                  {user?.user_metadata?.name || user?.email?.split('@')[0]}
                </p>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                className="btn-premium"
                onClick={async () => {
                  await supabase.auth.signOut();
                  router.push('/auth/login');
                }}
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8 animate-fadeInUp">
          <h1 className="heading-1 text-gray-900 mb-2">Dashboard</h1>
          <p className="body-large text-gray-600">Manage your family's secure digital vault</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="premium-card animate-fadeInUp" style={{animationDelay: '0.1s'}}>
            <CardContent className="flex items-center p-6">
              <div className="icon-button bg-blue-50">
                <Key className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{stats.passwords}</p>
                <p className="caption">Passwords</p>
              </div>
            </CardContent>
          </Card>

          <Card className="premium-card animate-fadeInUp" style={{animationDelay: '0.2s'}}>
            <CardContent className="flex items-center p-6">
              <div className="icon-button bg-green-50">
                <FileText className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{stats.documents}</p>
                <p className="caption">Documents</p>
              </div>
            </CardContent>
          </Card>

          <Card className="premium-card animate-fadeInUp" style={{animationDelay: '0.3s'}}>
            <CardContent className="flex items-center p-6">
              <div className="icon-button bg-purple-50">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{stats.familyMembers}</p>
                <p className="caption">Family Members</p>
              </div>
            </CardContent>
          </Card>

          <Card className="premium-card animate-fadeInUp" style={{animationDelay: '0.4s'}}>
            <CardContent className="flex items-center p-6">
              <div className="icon-button bg-orange-50">
                <Activity className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{stats.uptime}</p>
                <p className="caption">Uptime</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="password-card animate-slideInRight cursor-pointer" style={{animationDelay: '0.1s'}}>
            <CardHeader>
              <CardTitle className="heading-2 flex items-center">
                <div className="icon-button bg-blue-50 mr-3">
                  <Key className="h-5 w-5 text-blue-600" />
                </div>
                Password Manager
              </CardTitle>
              <CardDescription className="caption">
                Secure password storage with breach detection
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/passwords">
                <Button className="btn-premium w-full">
                  Manage Passwords
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="password-card animate-slideInRight cursor-pointer" style={{animationDelay: '0.2s'}}>
            <CardHeader>
              <CardTitle className="heading-2 flex items-center">
                <div className="icon-button bg-green-50 mr-3">
                  <FileText className="h-5 w-5 text-green-600" />
                </div>
                Document Vault
              </CardTitle>
              <CardDescription className="caption">
                Encrypted storage for important family documents
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/documents">
                <Button className="btn-security w-full">
                  Access Documents
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="password-card animate-slideInRight cursor-pointer" style={{animationDelay: '0.3s'}}>
            <CardHeader>
              <CardTitle className="heading-2 flex items-center">
                <div className="icon-button bg-purple-50 mr-3">
                  <Users className="h-5 w-5 text-purple-600" />
                </div>
                Family Access
              </CardTitle>
              <CardDescription className="caption">
                Manage family member roles and permissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/family">
                <Button className="btn-premium w-full">
                  Manage Access
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="password-card animate-slideInRight cursor-pointer" style={{animationDelay: '0.4s'}}>
            <CardHeader>
              <CardTitle className="heading-2 flex items-center">
                <div className="icon-button bg-red-50 mr-3">
                  <Shield className="h-5 w-5 text-red-600" />
                </div>
                Security Center
              </CardTitle>
              <CardDescription className="caption">
                2FA setup, audit logs, and security settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/security">
                <Button className="btn-security w-full">
                  Security Settings
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="password-card animate-slideInRight cursor-pointer" style={{animationDelay: '0.5s'}}>
            <CardHeader>
              <CardTitle className="heading-2 flex items-center">
                <div className="icon-button bg-indigo-50 mr-3">
                  <FileText className="h-5 w-5 text-indigo-600" />
                </div>
                Legal Documents
              </CardTitle>
              <CardDescription className="caption">
                DocuSign integration and lawyer access management
              </CardDescription>
            </CardHeader>
            <CardContent>
                <Link href="/legal">
                <Button className="btn-premium w-full">
                  Legal Center
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="password-card animate-slideInRight cursor-pointer" style={{animationDelay: '0.6s'}}>
            <CardHeader>
              <CardTitle className="heading-2 flex items-center">
                <div className="icon-button bg-gray-50 mr-3">
                  <Settings className="h-5 w-5 text-gray-600" />
                </div>
                Settings
              </CardTitle>
              <CardDescription className="caption">
                System preferences and configuration
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/settings">
                <Button className="btn-security w-full">
                  Preferences
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card className="premium-card mt-8 animate-fadeInUp" style={{animationDelay: '0.7s'}}>
          <CardHeader>
            <CardTitle className="heading-2 flex items-center">
              <div className="icon-button bg-blue-50 mr-3">
                <Activity className="h-5 w-5 text-blue-600" />
              </div>
              Recent Activity
            </CardTitle>
            <CardDescription className="caption">Latest security events and access logs</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentEvents.length > 0 ? (
                recentEvents.map((event, index) => (
                  <div key={event.id} className="password-card flex items-center space-x-4 p-4 animate-slideInRight" style={{animationDelay: `${0.8 + index * 0.1}s`}}>
                    <div className="icon-button">
                      {getEventIcon(event.type, event.status)}
                    </div>
                    <div className="flex-1">
                      <p className="body-large font-medium">{event.description}</p>
                      <div className="flex items-center space-x-4 caption">
                        <span>{formatTimestamp(event.timestamp)}</span>
                        {event.location && <span>• {event.location}</span>}
                        {event.device && <span>• {event.device}</span>}
                      </div>
                    </div>
                    {event.status === 'success' && (
                      <span className="security-badge badge-secure">Secure</span>
                    )}
                    {event.status === 'warning' && (
                      <span className="security-badge badge-warning">Warning</span>
                    )}
                    {event.status === 'error' && (
                      <span className="security-badge badge-danger">Alert</span>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500 animate-fadeInUp">
                  <div className="icon-button bg-gray-50 mx-auto mb-4 w-16 h-16">
                    <Activity className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="body-large">No recent activity</p>
                  <p className="caption">Start using the vault to see your activity here</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}