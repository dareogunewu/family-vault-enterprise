'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, Key, FileText, Users, Activity, Settings } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('authToken');
    if (!token) {
      window.location.href = '/login';
      return;
    }

    // In a real app, you'd validate the token and get user info
    setUser({ name: 'John Doe', email: 'john@example.com', role: 'admin' });
    setIsLoading(false);
  }, []);

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
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-blue-600 mr-3" />
              <h1 className="text-xl font-semibold text-gray-900">Family Vault Enterprise</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">Welcome, John Doe</span>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  localStorage.removeItem('authToken');
                  window.location.href = '/login';
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
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h2>
          <p className="text-gray-600">Manage your family's secure digital vault</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="flex items-center p-6">
              <Key className="h-8 w-8 text-blue-600 mr-4" />
              <div>
                <p className="text-2xl font-bold text-gray-900">42</p>
                <p className="text-gray-600">Passwords</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center p-6">
              <FileText className="h-8 w-8 text-green-600 mr-4" />
              <div>
                <p className="text-2xl font-bold text-gray-900">18</p>
                <p className="text-gray-600">Documents</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center p-6">
              <Users className="h-8 w-8 text-purple-600 mr-4" />
              <div>
                <p className="text-2xl font-bold text-gray-900">4</p>
                <p className="text-gray-600">Family Members</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center p-6">
              <Activity className="h-8 w-8 text-orange-600 mr-4" />
              <div>
                <p className="text-2xl font-bold text-gray-900">99.9%</p>
                <p className="text-gray-600">Uptime</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Key className="h-5 w-5 text-blue-600 mr-2" />
                Password Manager
              </CardTitle>
              <CardDescription>
                Manage passwords with YubiKey security and breach detection
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/passwords">
                <Button className="w-full">
                  Manage Passwords
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 text-green-600 mr-2" />
                Document Vault
              </CardTitle>
              <CardDescription>
                Encrypted storage for important family documents
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/documents">
                <Button className="w-full">
                  Access Documents
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="h-5 w-5 text-purple-600 mr-2" />
                Family Access
              </CardTitle>
              <CardDescription>
                Manage family member roles and permissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/family">
                <Button className="w-full">
                  Manage Access
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="h-5 w-5 text-red-600 mr-2" />
                Security Center
              </CardTitle>
              <CardDescription>
                YubiKey management, audit logs, and security settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full"
                onClick={() => alert('Security Center coming soon!\n\nThis would include:\n• YubiKey device management\n• Security audit logs\n• Two-factor authentication settings\n• Login history and alerts\n• Security policy configuration')}
              >
                Security Settings
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 text-indigo-600 mr-2" />
                Legal Documents
              </CardTitle>
              <CardDescription>
                DocuSign integration and lawyer access management
              </CardDescription>
            </CardHeader>
            <CardContent>
                <Link href="/legal">
                <Button className="w-full">
                  Legal Center
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="h-5 w-5 text-gray-600 mr-2" />
                Settings
              </CardTitle>
              <CardDescription>
                System preferences and configuration
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full"
                onClick={() => alert('System Settings coming soon!\n\nThis would include:\n• Account preferences\n• Notification settings\n• Backup configuration\n• Import/Export data\n• Privacy settings')}
              >
                Preferences
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest security events and access logs</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                <Shield className="h-5 w-5 text-green-600" />
                <div className="flex-1">
                  <p className="font-medium">Successful YubiKey authentication</p>
                  <p className="text-sm text-gray-600">2 minutes ago</p>
                </div>
              </div>
              <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                <FileText className="h-5 w-5 text-blue-600" />
                <div className="flex-1">
                  <p className="font-medium">Document accessed: Insurance Policy</p>
                  <p className="text-sm text-gray-600">1 hour ago</p>
                </div>
              </div>
              <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                <Key className="h-5 w-5 text-purple-600" />
                <div className="flex-1">
                  <p className="font-medium">Password updated: Banking Account</p>
                  <p className="text-sm text-gray-600">3 hours ago</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}