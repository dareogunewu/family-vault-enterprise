'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
// import { Badge } from '@/components/ui/badge';
import { Users, UserPlus, Settings, Shield, Clock, Mail, ArrowLeft, X, Trash2, Edit } from 'lucide-react';
import Link from 'next/link';

interface FamilyMember {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'member' | 'viewer' | 'emergency';
  status: 'active' | 'pending' | 'inactive';
  joinDate: string;
  lastAccess: string;
  permissions: string[];
}

export default function FamilyPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showManageModal, setShowManageModal] = useState(false);
  const [managingMember, setManagingMember] = useState<FamilyMember | null>(null);
  const [inviteForm, setInviteForm] = useState({
    name: '',
    email: '',
    role: 'member' as FamilyMember['role'],
    permissions: [] as string[]
  });
  // Default family members data
  const defaultFamilyMembers: FamilyMember[] = [
    {
      id: '1',
      name: 'John Doe',
      email: 'john@example.com',
      role: 'admin',
      status: 'active',
      joinDate: '2024-01-01',
      lastAccess: '2024-01-15',
      permissions: ['passwords', 'documents', 'family', 'settings', 'emergency']
    },
    {
      id: '2',
      name: 'Jane Doe',
      email: 'jane@example.com',
      role: 'member',
      status: 'active',
      joinDate: '2024-01-02',
      lastAccess: '2024-01-14',
      permissions: ['passwords', 'documents', 'family']
    },
    {
      id: '3',
      name: 'Alex Doe',
      email: 'alex@example.com',
      role: 'viewer',
      status: 'active',
      joinDate: '2024-01-05',
      lastAccess: '2024-01-13',
      permissions: ['documents']
    },
    {
      id: '4',
      name: 'Emma Doe',
      email: 'emma@example.com',
      role: 'member',
      status: 'pending',
      joinDate: '2024-01-10',
      lastAccess: 'Never',
      permissions: ['passwords', 'documents']
    },
    {
      id: '5',
      name: 'Robert Smith (Lawyer)',
      email: 'robert.smith@lawfirm.com',
      role: 'emergency',
      status: 'active',
      joinDate: '2024-01-08',
      lastAccess: '2024-01-12',
      permissions: ['documents', 'emergency']
    }
  ];

  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);

  // Load family members from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('family-vault-members');
    if (stored) {
      setFamilyMembers(JSON.parse(stored));
    } else {
      setFamilyMembers(defaultFamilyMembers);
    }
  }, []);

  // Save to localStorage whenever family members change
  useEffect(() => {
    if (familyMembers.length > 0) {
      localStorage.setItem('family-vault-members', JSON.stringify(familyMembers));
    }
  }, [familyMembers]);

  const availablePermissions = [
    { id: 'passwords', label: 'Passwords', description: 'Access to password vault' },
    { id: 'documents', label: 'Documents', description: 'Access to document vault' },
    { id: 'family', label: 'Family', description: 'View family members' },
    { id: 'settings', label: 'Settings', description: 'Modify account settings' },
    { id: 'emergency', label: 'Emergency', description: 'Emergency access protocols' }
  ];

  const roles = ['all', 'admin', 'member', 'viewer', 'emergency'];

  const filteredMembers = familyMembers.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRole === 'all' || member.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'member': return 'bg-blue-100 text-blue-800';
      case 'viewer': return 'bg-green-100 text-green-800';
      case 'emergency': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleDescription = (role: string) => {
    switch (role) {
      case 'admin': return 'Full access to all features and settings';
      case 'member': return 'Access to passwords, documents, and family features';
      case 'viewer': return 'Read-only access to shared documents';
      case 'emergency': return 'Emergency access to critical documents only';
      default: return 'No access';
    }
  };

  // Handle invitation
  const handleInviteMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteForm.name || !inviteForm.email) {
      alert('Please fill in all required fields');
      return;
    }

    const newMember: FamilyMember = {
      id: Date.now().toString(),
      name: inviteForm.name,
      email: inviteForm.email,
      role: inviteForm.role,
      status: 'pending',
      joinDate: new Date().toISOString().split('T')[0],
      lastAccess: 'Never',
      permissions: getDefaultPermissions(inviteForm.role)
    };

    setFamilyMembers([...familyMembers, newMember]);
    setShowInviteModal(false);
    setInviteForm({ name: '', email: '', role: 'member', permissions: [] });
    alert(`Invitation sent to ${inviteForm.name} (${inviteForm.email})`);
  };

  const getDefaultPermissions = (role: FamilyMember['role']): string[] => {
    switch (role) {
      case 'admin': return ['passwords', 'documents', 'family', 'settings', 'emergency'];
      case 'member': return ['passwords', 'documents', 'family'];
      case 'viewer': return ['documents'];
      case 'emergency': return ['documents', 'emergency'];
      default: return [];
    }
  };

  const handleManageMember = (member: FamilyMember) => {
    setManagingMember({ ...member });
    setShowManageModal(true);
  };

  const handleUpdateMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!managingMember) return;

    const updatedMembers = familyMembers.map(member =>
      member.id === managingMember.id ? managingMember : member
    );
    setFamilyMembers(updatedMembers);
    setShowManageModal(false);
    setManagingMember(null);
    alert('Member updated successfully');
  };

  const handleRemoveMember = (memberId: string, memberName: string) => {
    if (confirm(`Are you sure you want to remove ${memberName} from your family vault? This action cannot be undone.`)) {
      setFamilyMembers(familyMembers.filter(member => member.id !== memberId));
      alert(`${memberName} has been removed from your family vault.`);
    }
  };

  const handleResendInvite = (member: FamilyMember) => {
    alert(`Invitation resent to ${member.name} (${member.email})`);
  };

  const handleRoleChange = (role: FamilyMember['role']) => {
    if (managingMember) {
      setManagingMember({
        ...managingMember,
        role,
        permissions: getDefaultPermissions(role)
      });
    }
  };

  const togglePermission = (permissionId: string) => {
    if (managingMember) {
      const permissions = managingMember.permissions.includes(permissionId)
        ? managingMember.permissions.filter(p => p !== permissionId)
        : [...managingMember.permissions, permissionId];
      
      setManagingMember({
        ...managingMember,
        permissions
      });
    }
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
              <Users className="h-8 w-8 text-purple-600 mr-3" />
              <h1 className="text-xl font-semibold text-gray-900">Family Access</h1>
            </div>
            <Button 
              className="bg-purple-600 hover:bg-purple-700"
              onClick={() => setShowInviteModal(true)}
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Invite Member
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Family Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="flex items-center p-6">
              <Users className="h-8 w-8 text-blue-600 mr-4" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{familyMembers.length}</p>
                <p className="text-gray-600">Total Members</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center p-6">
              <Shield className="h-8 w-8 text-green-600 mr-4" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{familyMembers.filter(m => m.status === 'active').length}</p>
                <p className="text-gray-600">Active Members</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center p-6">
              <Clock className="h-8 w-8 text-yellow-600 mr-4" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{familyMembers.filter(m => m.status === 'pending').length}</p>
                <p className="text-gray-600">Pending Invites</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center p-6">
              <Shield className="h-8 w-8 text-red-600 mr-4" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{familyMembers.filter(m => m.role === 'admin').length}</p>
                <p className="text-gray-600">Administrators</p>
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
                  placeholder="Search family members by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                {roles.map((role) => (
                  <Button
                    key={role}
                    variant={selectedRole === role ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedRole(role)}
                  >
                    {role === 'all' ? 'All Roles' : role.charAt(0).toUpperCase() + role.slice(1)}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Family Members List */}
        <div className="space-y-4">
          {filteredMembers.map((member) => (
            <Card key={member.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 flex-1">
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                      <Users className="h-6 w-6 text-purple-600" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {member.name}
                        </h3>
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${getRoleColor(member.role)}`}>
                          {member.role}
                        </span>
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${getStatusColor(member.status)}`}>
                          {member.status}
                        </span>
                      </div>
                      
                      <div className="text-sm text-gray-600 space-y-1">
                        <div className="flex items-center gap-1">
                          <Mail className="h-4 w-4" />
                          <span>{member.email}</span>
                        </div>
                        
                        <div>
                          <strong>Permissions:</strong> {getRoleDescription(member.role)}
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <span><strong>Joined:</strong> {new Date(member.joinDate).toLocaleDateString()}</span>
                          <span><strong>Last Access:</strong> {member.lastAccess === 'Never' ? 'Never' : new Date(member.lastAccess).toLocaleDateString()}</span>
                        </div>

                        <div>
                          <strong>Access to:</strong> {member.permissions.join(', ')}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleManageMember(member)}
                    >
                      <Settings className="h-4 w-4 mr-1" />
                      Manage
                    </Button>
                    {member.status === 'pending' && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleResendInvite(member)}
                      >
                        <Mail className="h-4 w-4 mr-1" />
                        Resend
                      </Button>
                    )}
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-red-600 hover:text-red-700"
                      onClick={() => handleRemoveMember(member.id, member.name)}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredMembers.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No family members found</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || selectedRole !== 'all' 
                  ? 'Try adjusting your search terms or filters.' 
                  : 'Get started by inviting your first family member.'}
              </p>
              <Button 
                className="bg-purple-600 hover:bg-purple-700"
                onClick={() => setShowInviteModal(true)}
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Invite Family Member
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Role Information */}
        <div className="mt-12">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Family Access Roles</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="border-red-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-red-700 flex items-center">
                  <Shield className="h-5 w-5 mr-2" />
                  Administrator
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-gray-600">
                <ul className="space-y-1">
                  <li>• Full system access</li>
                  <li>• Manage all family members</li>
                  <li>• Configure security settings</li>
                  <li>• Emergency access protocols</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-blue-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-blue-700 flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  Member
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-gray-600">
                <ul className="space-y-1">
                  <li>• Access passwords & documents</li>
                  <li>• Share within family</li>
                  <li>• Upload documents</li>
                  <li>• View family activity</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-green-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-green-700 flex items-center">
                  <Shield className="h-5 w-5 mr-2" />
                  Viewer
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-gray-600">
                <ul className="space-y-1">
                  <li>• Read-only access</li>
                  <li>• View shared documents</li>
                  <li>• No password access</li>
                  <li>• Cannot modify data</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-orange-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-orange-700 flex items-center">
                  <Shield className="h-5 w-5 mr-2" />
                  Emergency
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-gray-600">
                <ul className="space-y-1">
                  <li>• Emergency access only</li>
                  <li>• Critical documents</li>
                  <li>• Legal professionals</li>
                  <li>• Time-limited access</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Invite Member Modal */}
        {showInviteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Invite Family Member
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => {
                      setShowInviteModal(false);
                      setInviteForm({ name: '', email: '', role: 'member', permissions: [] });
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </CardTitle>
                <CardDescription>
                  Send an invitation to add a family member to your vault with specific permissions.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleInviteMember} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="invite-name">Full Name *</Label>
                    <Input
                      id="invite-name"
                      value={inviteForm.name}
                      onChange={(e) => setInviteForm({ ...inviteForm, name: e.target.value })}
                      placeholder="Enter the person's full name"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="invite-email">Email Address *</Label>
                    <Input
                      id="invite-email"
                      type="email"
                      value={inviteForm.email}
                      onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                      placeholder="Enter their email address"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="invite-role">Role *</Label>
                    <select
                      id="invite-role"
                      className="flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      value={inviteForm.role}
                      onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value as FamilyMember['role'] })}
                      required
                    >
                      <option value="member">Member</option>
                      <option value="viewer">Viewer</option>
                      <option value="emergency">Emergency</option>
                      <option value="admin">Administrator</option>
                    </select>
                    <p className="text-sm text-gray-600">
                      {getRoleDescription(inviteForm.role)}
                    </p>
                  </div>

                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <div className="flex items-start">
                      <Mail className="h-5 w-5 text-purple-600 mr-3 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-purple-900">Secure Invitation Process</h4>
                        <p className="text-sm text-purple-800 mt-1">
                          The invitation will be sent via encrypted email. The recipient will need to create an account 
                          and verify their identity with YubiKey authentication before gaining access.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button 
                      type="button" 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => {
                        setShowInviteModal(false);
                        setInviteForm({ name: '', email: '', role: 'member', permissions: [] });
                      }}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      className="flex-1 bg-purple-600 hover:bg-purple-700"
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Send Invitation
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Manage Member Modal */}
        {showManageModal && managingMember && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Manage {managingMember.name}
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => {
                      setShowManageModal(false);
                      setManagingMember(null);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </CardTitle>
                <CardDescription>
                  Update role and permissions for this family member.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpdateMember} className="space-y-6">
                  <div className="space-y-2">
                    <Label>Member Information</Label>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="space-y-2 text-sm">
                        <div><strong>Name:</strong> {managingMember.name}</div>
                        <div><strong>Email:</strong> {managingMember.email}</div>
                        <div><strong>Status:</strong> 
                          <span className={`ml-2 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${getStatusColor(managingMember.status)}`}>
                            {managingMember.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="manage-role">Role</Label>
                    <select
                      id="manage-role"
                      className="flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      value={managingMember.role}
                      onChange={(e) => handleRoleChange(e.target.value as FamilyMember['role'])}
                    >
                      <option value="member">Member</option>
                      <option value="viewer">Viewer</option>
                      <option value="emergency">Emergency</option>
                      <option value="admin">Administrator</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label>Permissions</Label>
                    <div className="space-y-2">
                      {availablePermissions.map((permission) => (
                        <div key={permission.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex-1">
                            <div className="font-medium">{permission.label}</div>
                            <div className="text-sm text-gray-600">{permission.description}</div>
                          </div>
                          <input
                            type="checkbox"
                            checked={managingMember.permissions.includes(permission.id)}
                            onChange={() => togglePermission(permission.id)}
                            className="ml-3 h-4 w-4 text-purple-600 rounded border-gray-300 focus:ring-purple-500"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button 
                      type="button" 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => {
                        setShowManageModal(false);
                        setManagingMember(null);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      className="flex-1 bg-purple-600 hover:bg-purple-700"
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Update Member
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}