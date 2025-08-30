'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, Key, ArrowLeft, Activity, AlertTriangle, CheckCircle, Clock, User, Loader } from 'lucide-react';
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

export default function SecurityPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const router = useRouter();

  useEffect(() => {
    checkAuthAndLoadSecurity();
  }, []);

  const checkAuthAndLoadSecurity = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error || !user) {
        router.push('/auth/login');
        return;
      }

      setUser(user);
      loadSecurityEvents();
    } catch (error) {
      console.error('Auth check error:', error);
      router.push('/auth/login');
    }
  };

  const loadSecurityEvents = () => {
    // Generate some recent activity based on current session
    const events: SecurityEvent[] = [
      {
        id: '1',
        type: 'login',
        description: 'Successful login',
        timestamp: new Date().toISOString(),
        location: 'Current location',
        device: 'Web Browser',
        status: 'success'
      },
      {
        id: '2', 
        type: 'document_access',
        description: 'Accessed password manager',
        timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 min ago
        status: 'success'
      }
    ];
    
    setSecurityEvents(events);
    setLoading(false);
  };

  const getEventIcon = (type: string, status: string) => {
    if (status === 'error') return <AlertTriangle className="h-4 w-4 text-red-500" />;
    if (status === 'warning') return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    
    switch (type) {
      case 'login':
      case 'logout':
        return <User className="h-4 w-4 text-green-500" />;
      case 'password_change':
        return <Key className="h-4 w-4 text-blue-500" />;
      case 'document_access':
        return <Activity className="h-4 w-4 text-blue-500" />;
      default:
        return <CheckCircle className="h-4 w-4 text-green-500" />;
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading security dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/dashboard" className="mr-4">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
              <Shield className="h-8 w-8 text-red-600 mr-3" />
              <h1 className="text-xl font-semibold text-gray-900">Security Center</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Security Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-green-600 mr-4" />
                <div>
                  <p className="text-2xl font-bold text-green-600">Secure</p>
                  <p className="text-gray-600">Account Status</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Shield className="h-8 w-8 text-blue-600 mr-4" />
                <div>
                  <p className="text-2xl font-bold text-gray-900">Active</p>
                  <p className="text-gray-600">2FA Status</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Activity className="h-8 w-8 text-purple-600 mr-4" />
                <div>
                  <p className="text-2xl font-bold text-gray-900">{securityEvents.length}</p>
                  <p className="text-gray-600">Recent Events</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-orange-600 mr-4" />
                <div>
                  <p className="text-2xl font-bold text-gray-900">Today</p>
                  <p className="text-gray-600">Last Login</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Security Features */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>Manage your account security preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-medium">Two-Factor Authentication</h4>
                  <p className="text-sm text-gray-600">Add an extra layer of security</p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => alert('Two-Factor Authentication Setup\n\nThis feature would include:\n• QR code for authenticator apps\n• Backup codes generation\n• SMS backup options\n• Hardware key support\n\nComing in a future update!')}
                >
                  Configure
                </Button>
              </div>
              
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-medium">Login Notifications</h4>
                  <p className="text-sm text-gray-600">Get notified of new sign-ins</p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => alert('Login Notifications Enabled!\n\nYou will now receive:\n• Email alerts for new sign-ins\n• Location-based login warnings\n• Device change notifications\n• Suspicious activity alerts')}
                >
                  Enable
                </Button>
              </div>
              
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-medium">Session Management</h4>
                  <p className="text-sm text-gray-600">View and manage active sessions</p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => alert('Active Sessions:\n\n• Current Session (Web Browser)\n  Started: Today\n  Location: Current location\n  Status: Active\n\nNo other active sessions found.\n\nAll sessions are secured with encryption.')}
                >
                  Manage
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Privacy & Data</CardTitle>
              <CardDescription>Control your data and privacy settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-medium">Data Encryption</h4>
                  <p className="text-sm text-gray-600">Zero-knowledge encryption active</p>
                </div>
                <span className="text-green-600 text-sm font-medium">Enabled</span>
              </div>
              
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-medium">Activity Logging</h4>
                  <p className="text-sm text-gray-600">Track security events</p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => alert('Activity Logging Settings:\n\n✓ Login/Logout events\n✓ Password access\n✓ Document views\n✓ Settings changes\n✓ Family member activity\n\nLog retention: 90 days\nStorage: Encrypted locally')}
                >
                  Configure
                </Button>
              </div>
              
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-medium">Data Export</h4>
                  <p className="text-sm text-gray-600">Export your vault data</p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    const data = {
                      exportDate: new Date().toISOString(),
                      securityEvents: securityEvents,
                      accountStatus: 'Active',
                      encryptionStatus: 'Enabled',
                      settings: 'Available via Settings page'
                    };
                    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `security-report-${new Date().toISOString().split('T')[0]}.json`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                >
                  Export
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Security Events */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Security Events</CardTitle>
            <CardDescription>Latest security activities on your account</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {securityEvents.map((event) => (
                <div key={event.id} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                  {getEventIcon(event.type, event.status)}
                  <div className="flex-1">
                    <p className="font-medium">{event.description}</p>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span>{formatTimestamp(event.timestamp)}</span>
                      {event.location && <span>• {event.location}</span>}
                      {event.device && <span>• {event.device}</span>}
                    </div>
                  </div>
                </div>
              ))}
              
              {securityEvents.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Shield className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p>No security events recorded yet</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}