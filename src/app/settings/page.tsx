'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Settings, User, Bell, Download, Upload, ArrowLeft, Loader, Save } from 'lucide-react';
import Link from 'next/link';

interface UserSettings {
  name: string;
  email: string;
  notifications: {
    loginAlerts: boolean;
    securityUpdates: boolean;
    familyActivity: boolean;
    breachAlerts: boolean;
  };
  preferences: {
    theme: 'light' | 'dark' | 'system';
    language: string;
    autoLock: number; // minutes
    backupFrequency: 'daily' | 'weekly' | 'monthly';
  };
}

export default function SettingsPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<UserSettings>({
    name: '',
    email: '',
    notifications: {
      loginAlerts: true,
      securityUpdates: true,
      familyActivity: false,
      breachAlerts: true,
    },
    preferences: {
      theme: 'light',
      language: 'en',
      autoLock: 15,
      backupFrequency: 'weekly',
    },
  });
  const router = useRouter();

  useEffect(() => {
    checkAuthAndLoadSettings();
  }, []);

  const checkAuthAndLoadSettings = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error || !user) {
        router.push('/auth/login');
        return;
      }

      setUser(user);
      loadUserSettings(user);
    } catch (error) {
      console.error('Auth check error:', error);
      router.push('/auth/login');
    }
  };

  const loadUserSettings = async (currentUser: any) => {
    try {
      // Load settings from localStorage (in a real app, this would be from database)
      const savedSettings = localStorage.getItem(`settings_${currentUser.id}`);
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        setSettings({
          ...settings,
          ...parsed,
          name: currentUser.user_metadata?.name || currentUser.email,
          email: currentUser.email,
        });
      } else {
        setSettings(prev => ({
          ...prev,
          name: currentUser.user_metadata?.name || currentUser.email,
          email: currentUser.email,
        }));
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!user) return;
    
    setSaving(true);
    try {
      // Save to localStorage (in a real app, this would save to database)
      localStorage.setItem(`settings_${user.id}`, JSON.stringify(settings));
      
      // Update user metadata in Supabase if name changed
      if (settings.name !== user.user_metadata?.name) {
        const { error } = await supabase.auth.updateUser({
          data: { name: settings.name }
        });
        if (error) {
          console.error('Error updating user metadata:', error);
        }
      }
      
      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const exportData = () => {
    if (!user) return;
    
    const data = {
      passwords: JSON.parse(localStorage.getItem(`passwords_${user.id}`) || '[]'),
      documents: JSON.parse(localStorage.getItem(`documents_${user.id}`) || '[]'),
      settings: settings,
      exportDate: new Date().toISOString(),
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `family-vault-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        
        if (confirm('This will overwrite your current data. Are you sure you want to import this backup?')) {
          // Import data (in a real app, this would need proper validation)
          if (data.passwords) {
            localStorage.setItem(`passwords_${user?.id}`, JSON.stringify(data.passwords));
          }
          if (data.documents) {
            localStorage.setItem(`documents_${user?.id}`, JSON.stringify(data.documents));
          }
          if (data.settings) {
            setSettings(data.settings);
          }
          alert('Data imported successfully! Please refresh the page.');
        }
      } catch (error) {
        alert('Invalid backup file format.');
      }
    };
    reader.readAsText(file);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading settings...</p>
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
              <Settings className="h-8 w-8 text-gray-600 mr-3" />
              <h1 className="text-xl font-semibold text-gray-900">Settings</h1>
            </div>
            <Button onClick={saveSettings} disabled={saving}>
              {saving ? (
                <>
                  <Loader className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Profile Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="h-5 w-5 mr-2" />
              Profile Information
            </CardTitle>
            <CardDescription>Update your personal information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={settings.name}
                  onChange={(e) => setSettings(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={settings.email}
                  disabled
                  className="bg-gray-50"
                />
                <p className="text-xs text-gray-500">Email cannot be changed here</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Bell className="h-5 w-5 mr-2" />
              Notifications
            </CardTitle>
            <CardDescription>Configure how you want to be notified</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Login Alerts</h4>
                <p className="text-sm text-gray-600">Get notified when someone signs into your account</p>
              </div>
              <Switch
                checked={settings.notifications.loginAlerts}
                onCheckedChange={(checked) => 
                  setSettings(prev => ({
                    ...prev,
                    notifications: { ...prev.notifications, loginAlerts: checked }
                  }))
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Security Updates</h4>
                <p className="text-sm text-gray-600">Important security announcements and updates</p>
              </div>
              <Switch
                checked={settings.notifications.securityUpdates}
                onCheckedChange={(checked) => 
                  setSettings(prev => ({
                    ...prev,
                    notifications: { ...prev.notifications, securityUpdates: checked }
                  }))
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Family Activity</h4>
                <p className="text-sm text-gray-600">When family members access shared items</p>
              </div>
              <Switch
                checked={settings.notifications.familyActivity}
                onCheckedChange={(checked) => 
                  setSettings(prev => ({
                    ...prev,
                    notifications: { ...prev.notifications, familyActivity: checked }
                  }))
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Breach Alerts</h4>
                <p className="text-sm text-gray-600">When your passwords appear in data breaches</p>
              </div>
              <Switch
                checked={settings.notifications.breachAlerts}
                onCheckedChange={(checked) => 
                  setSettings(prev => ({
                    ...prev,
                    notifications: { ...prev.notifications, breachAlerts: checked }
                  }))
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Data Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Download className="h-5 w-5 mr-2" />
              Data Management
            </CardTitle>
            <CardDescription>Import and export your vault data</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h4 className="font-medium">Export Data</h4>
                <p className="text-sm text-gray-600">Download a backup of all your vault data</p>
              </div>
              <Button variant="outline" onClick={exportData}>
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h4 className="font-medium">Import Data</h4>
                <p className="text-sm text-gray-600">Restore from a previous backup file</p>
              </div>
              <div>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileImport}
                  className="hidden"
                  id="import-file"
                />
                <Button variant="outline" onClick={() => document.getElementById('import-file')?.click()}>
                  <Upload className="w-4 h-4 mr-2" />
                  Import
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Preferences */}
        <Card>
          <CardHeader>
            <CardTitle>Preferences</CardTitle>
            <CardDescription>Customize your vault experience</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="autolock">Auto-lock (minutes)</Label>
                <Input
                  id="autolock"
                  type="number"
                  min="1"
                  max="480"
                  value={settings.preferences.autoLock}
                  onChange={(e) => 
                    setSettings(prev => ({
                      ...prev,
                      preferences: { ...prev.preferences, autoLock: parseInt(e.target.value) || 15 }
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="backup">Backup Frequency</Label>
                <select
                  id="backup"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={settings.preferences.backupFrequency}
                  onChange={(e) => 
                    setSettings(prev => ({
                      ...prev,
                      preferences: { ...prev.preferences, backupFrequency: e.target.value as any }
                    }))
                  }
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}