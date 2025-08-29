'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
// import { Badge } from '@/components/ui/badge';
import { Shield, Key, Plus, Eye, EyeOff, Copy, Edit, Trash2, AlertTriangle, ArrowLeft, X, Save } from 'lucide-react';
import Link from 'next/link';

interface Password {
  id: string;
  title: string;
  username: string;
  password: string;
  url: string;
  category: string;
  strength: 'weak' | 'medium' | 'strong';
  breached: boolean;
  lastUpdated: string;
}

export default function PasswordsPage() {
  const [showPassword, setShowPassword] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingPassword, setEditingPassword] = useState<string>('');
  const [showAddForm, setShowAddForm] = useState(false);
  
  // Default passwords data
  const defaultPasswords: Password[] = [
    {
      id: '1',
      title: 'Gmail Account',
      username: 'john@example.com',
      password: 'MySecurePass123!',
      url: 'https://gmail.com',
      category: 'Email',
      strength: 'strong',
      breached: false,
      lastUpdated: '2024-01-15'
    },
    {
      id: '2',
      title: 'Banking - Chase',
      username: 'john.doe',
      password: 'BankPass456$',
      url: 'https://chase.com',
      category: 'Banking',
      strength: 'strong',
      breached: false,
      lastUpdated: '2024-01-10'
    },
    {
      id: '3',
      title: 'Netflix',
      username: 'family@example.com',
      password: 'netflix123',
      url: 'https://netflix.com',
      category: 'Entertainment',
      strength: 'weak',
      breached: true,
      lastUpdated: '2023-12-20'
    },
    {
      id: '4',
      title: 'Amazon',
      username: 'john@example.com',
      password: 'AmazonSecure789!',
      url: 'https://amazon.com',
      category: 'Shopping',
      strength: 'strong',
      breached: false,
      lastUpdated: '2024-01-08'
    }
  ];

  const [passwords, setPasswords] = useState<Password[]>([]);

  // Load passwords from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('family-vault-passwords');
    if (stored) {
      setPasswords(JSON.parse(stored));
    } else {
      setPasswords(defaultPasswords);
    }
  }, []);

  // Save to localStorage whenever passwords change
  useEffect(() => {
    if (passwords.length > 0) {
      localStorage.setItem('family-vault-passwords', JSON.stringify(passwords));
    }
  }, [passwords]);

  const [newPassword, setNewPassword] = useState({
    title: '',
    username: '',
    password: '',
    url: '',
    category: 'Personal'
  });

  // Functional handlers
  const handleAddPassword = () => {
    if (!newPassword.title || !newPassword.password) {
      alert('Please fill in at least the title and password');
      return;
    }

    const password: Password = {
      id: Date.now().toString(),
      title: newPassword.title,
      username: newPassword.username,
      password: newPassword.password,
      url: newPassword.url,
      category: newPassword.category,
      strength: getPasswordStrength(newPassword.password),
      breached: false,
      lastUpdated: new Date().toISOString().split('T')[0]
    };

    setPasswords([...passwords, password]);
    setNewPassword({ title: '', username: '', password: '', url: '', category: 'Personal' });
    setShowAddForm(false);
    alert('Password added successfully!');
  };

  const handleDeletePassword = (id: string) => {
    if (confirm('Are you sure you want to delete this password?')) {
      setPasswords(passwords.filter(p => p.id !== id));
      alert('Password deleted successfully!');
    }
  };

  const handleEditPassword = (password: Password) => {
    setNewPassword({
      title: password.title,
      username: password.username,
      password: password.password,
      url: password.url,
      category: password.category
    });
    setEditingPassword(password.id);
    setShowAddForm(true);
  };

  const handleUpdatePassword = () => {
    if (!newPassword.title || !newPassword.password) {
      alert('Please fill in at least the title and password');
      return;
    }

    setPasswords(passwords.map(p => 
      p.id === editingPassword 
        ? {
            ...p,
            title: newPassword.title,
            username: newPassword.username,
            password: newPassword.password,
            url: newPassword.url,
            category: newPassword.category,
            strength: getPasswordStrength(newPassword.password),
            lastUpdated: new Date().toISOString().split('T')[0]
          }
        : p
    ));

    setNewPassword({ title: '', username: '', password: '', url: '', category: 'Personal' });
    setEditingPassword('');
    setShowAddForm(false);
    alert('Password updated successfully!');
  };

  const generateSecurePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
    let password = '';
    for (let i = 0; i < 16; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPassword(prev => ({ ...prev, password }));
  };

  const getPasswordStrength = (password: string): 'weak' | 'medium' | 'strong' => {
    if (password.length < 8) return 'weak';
    if (password.length < 12 || !/(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9])/.test(password)) return 'medium';
    return 'strong';
  };

  const filteredPasswords = passwords.filter(pwd =>
    pwd.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pwd.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pwd.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStrengthColor = (strength: string) => {
    switch (strength) {
      case 'weak': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'strong': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // In real app, show toast notification
    alert('Copied to clipboard!');
  };

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
              <Key className="h-8 w-8 text-blue-600 mr-3" />
              <h1 className="text-xl font-semibold text-gray-900">Password Manager</h1>
            </div>
            <Button 
              className="bg-blue-600 hover:bg-blue-700"
              onClick={() => setShowAddForm(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Password
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Add/Edit Password Modal */}
        {showAddForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md mx-4">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  {editingPassword ? 'Edit Password' : 'Add New Password'}
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => {
                      setShowAddForm(false);
                      setEditingPassword('');
                      setNewPassword({ title: '', username: '', password: '', url: '', category: 'Personal' });
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                  <Input
                    value={newPassword.title}
                    onChange={(e) => setNewPassword(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g. Gmail Account"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Username/Email</label>
                  <Input
                    value={newPassword.username}
                    onChange={(e) => setNewPassword(prev => ({ ...prev, username: e.target.value }))}
                    placeholder="e.g. john@example.com"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                  <div className="flex gap-2">
                    <Input
                      type="password"
                      value={newPassword.password}
                      onChange={(e) => setNewPassword(prev => ({ ...prev, password: e.target.value }))}
                      placeholder="Enter password"
                    />
                    <Button 
                      variant="outline" 
                      onClick={generateSecurePassword}
                      title="Generate secure password"
                    >
                      <Key className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Website URL</label>
                  <Input
                    value={newPassword.url}
                    onChange={(e) => setNewPassword(prev => ({ ...prev, url: e.target.value }))}
                    placeholder="e.g. https://gmail.com"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={newPassword.category}
                    onChange={(e) => setNewPassword(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Personal">Personal</option>
                    <option value="Email">Email</option>
                    <option value="Banking">Banking</option>
                    <option value="Entertainment">Entertainment</option>
                    <option value="Shopping">Shopping</option>
                    <option value="Work">Work</option>
                    <option value="Social">Social</option>
                  </select>
                </div>
                
                <div className="flex gap-2 pt-4">
                  <Button 
                    className="flex-1"
                    onClick={editingPassword ? handleUpdatePassword : handleAddPassword}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {editingPassword ? 'Update Password' : 'Add Password'}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setShowAddForm(false);
                      setEditingPassword('');
                      setNewPassword({ title: '', username: '', password: '', url: '', category: 'Personal' });
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Security Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="flex items-center p-6">
              <Shield className="h-8 w-8 text-green-600 mr-4" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{passwords.filter(p => p.strength === 'strong').length}</p>
                <p className="text-gray-600">Strong Passwords</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center p-6">
              <AlertTriangle className="h-8 w-8 text-yellow-600 mr-4" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{passwords.filter(p => p.strength === 'weak').length}</p>
                <p className="text-gray-600">Weak Passwords</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center p-6">
              <AlertTriangle className="h-8 w-8 text-red-600 mr-4" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{passwords.filter(p => p.breached).length}</p>
                <p className="text-gray-600">Breached</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center p-6">
              <Key className="h-8 w-8 text-blue-600 mr-4" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{passwords.length}</p>
                <p className="text-gray-600">Total Passwords</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search passwords by name, username, or category..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline">All Categories</Button>
                <Button variant="outline">Show Weak</Button>
                <Button variant="outline">Show Breached</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Passwords List */}
        <div className="space-y-4">
          {filteredPasswords.map((password) => (
            <Card key={password.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 flex-1">
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                      <Key className="h-6 w-6 text-gray-600" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-semibold text-gray-900 truncate">
                          {password.title}
                        </h3>
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${getStrengthColor(password.strength)}`}>
                          {password.strength}
                        </span>
                        {password.breached && (
                          <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-red-100 text-red-800">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Breached
                          </span>
                        )}
                      </div>
                      
                      <div className="text-sm text-gray-600 space-y-1">
                        <div className="flex items-center gap-4">
                          <span><strong>Username:</strong> {password.username}</span>
                          <span><strong>URL:</strong> {password.url}</span>
                          <span><strong>Category:</strong> {password.category}</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <strong>Password:</strong>
                          <span className="font-mono">
                            {showPassword === password.id ? password.password : '••••••••••••'}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowPassword(showPassword === password.id ? '' : password.id)}
                          >
                            {showPassword === password.id ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(password.password)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        <div className="text-xs text-gray-500">
                          Last updated: {new Date(password.lastUpdated).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleEditPassword(password)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-red-600 hover:text-red-700"
                      onClick={() => handleDeletePassword(password.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredPasswords.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <Key className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No passwords found</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm ? 'Try adjusting your search terms.' : 'Get started by adding your first password.'}
              </p>
              <Button onClick={() => setShowAddForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Password
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}