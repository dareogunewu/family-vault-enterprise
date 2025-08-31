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
  Crown,
  DollarSign, 
  Users, 
  Activity, 
  Database, 
  TrendingUp,
  AlertTriangle,
  Clock,
  Shield,
  Server,
  CreditCard,
  UserCheck,
  UserX,
  Mail,
  Phone,
  Calendar,
  BarChart3,
  PieChart,
  LineChart,
  Settings,
  Download,
  RefreshCw
} from 'lucide-react';
import Link from 'next/link';

interface Customer {
  id: string;
  name: string;
  email: string;
  plan_type: 'free' | 'family' | 'enterprise';
  status: 'active' | 'inactive' | 'suspended' | 'trial';
  created_at: string;
  last_login: string | null;
  mrr: number;
  members_count: number;
  storage_used: number;
  support_tickets: number;
}

interface Subscription {
  id: string;
  customer_id: string;
  plan: string;
  status: 'active' | 'canceled' | 'past_due';
  current_period_start: string;
  current_period_end: string;
  amount: number;
  currency: string;
}

interface SystemMetrics {
  total_customers: number;
  active_customers: number;
  trial_customers: number;
  mrr: number;
  churn_rate: number;
  uptime: string;
  api_requests_24h: number;
  storage_used_gb: number;
  database_size_mb: number;
}

export default function OwnerAdminConsole() {
  const [user, setUser] = useState<any>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Data states
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [metrics, setMetrics] = useState<SystemMetrics>({
    total_customers: 0,
    active_customers: 0,
    trial_customers: 0,
    mrr: 0,
    churn_rate: 0,
    uptime: '99.9%',
    api_requests_24h: 0,
    storage_used_gb: 0,
    database_size_mb: 0
  });

  const router = useRouter();
  const { isAuthenticated, isLoading: sessionLoading, showIdleWarning, timeUntilExpiry, extendSession, signOut } = useSession();

  useEffect(() => {
    const checkOwnerAccess = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error || !user) {
          router.push('/auth/login');
          return;
        }

        setUser(user);

        // Check if user is the system owner (your email)
        const ownerEmail = 'dareogunewu@gmail.com'; // Your email as system owner
        const userIsOwner = user.email === ownerEmail;
        
        if (!userIsOwner) {
          router.push('/dashboard');
          return;
        }

        setIsOwner(true);
        await loadOwnerData();
      } catch (error) {
        console.error('Owner access check error:', error);
        router.push('/auth/login');
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated) {
      checkOwnerAccess();
    }
  }, [isAuthenticated, router]);

  const loadOwnerData = async () => {
    try {
      await Promise.all([
        loadCustomers(),
        loadSubscriptions(),
        loadSystemMetrics()
      ]);
    } catch (error) {
      console.error('Error loading owner data:', error);
    }
  };

  const loadCustomers = async () => {
    // Mock data - replace with actual customer queries
    const mockCustomers: Customer[] = [
      {
        id: '1',
        name: 'Smith Family',
        email: 'smith@example.com',
        plan_type: 'family',
        status: 'active',
        created_at: '2024-01-15T00:00:00Z',
        last_login: '2024-08-30T10:30:00Z',
        mrr: 9.99,
        members_count: 4,
        storage_used: 2.5,
        support_tickets: 0
      },
      {
        id: '2',
        name: 'Johnson Enterprise',
        email: 'admin@johnson-corp.com',
        plan_type: 'enterprise',
        status: 'active',
        created_at: '2024-02-01T00:00:00Z',
        last_login: '2024-08-31T09:15:00Z',
        mrr: 49.99,
        members_count: 25,
        storage_used: 15.8,
        support_tickets: 2
      },
      {
        id: '3',
        name: 'Wilson Trial',
        email: 'wilson@example.com',
        plan_type: 'family',
        status: 'trial',
        created_at: '2024-08-25T00:00:00Z',
        last_login: '2024-08-30T14:20:00Z',
        mrr: 0,
        members_count: 2,
        storage_used: 0.3,
        support_tickets: 1
      }
    ];
    setCustomers(mockCustomers);
  };

  const loadSubscriptions = async () => {
    // Mock subscription data
    const mockSubs: Subscription[] = [
      {
        id: 'sub_1',
        customer_id: '1',
        plan: 'Family Plan',
        status: 'active',
        current_period_start: '2024-08-01T00:00:00Z',
        current_period_end: '2024-09-01T00:00:00Z',
        amount: 9.99,
        currency: 'USD'
      },
      {
        id: 'sub_2',
        customer_id: '2',
        plan: 'Enterprise Plan',
        status: 'active',
        current_period_start: '2024-08-01T00:00:00Z',
        current_period_end: '2024-09-01T00:00:00Z',
        amount: 49.99,
        currency: 'USD'
      }
    ];
    setSubscriptions(mockSubs);
  };

  const loadSystemMetrics = async () => {
    // Get actual user count from database
    const { count: userCount } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    const { count: orgCount } = await supabase
      .from('organizations')
      .select('*', { count: 'exact', head: true });

    const { count: sessionCount } = await supabase
      .from('user_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    // Mock additional metrics (replace with real data sources)
    setMetrics({
      total_customers: userCount || 0,
      active_customers: sessionCount || 0,
      trial_customers: 1,
      mrr: 59.98, // Monthly Recurring Revenue
      churn_rate: 2.5,
      uptime: '99.97%',
      api_requests_24h: 15420,
      storage_used_gb: 18.6,
      database_size_mb: 245.8
    });
  };

  const suspendCustomer = async (customerId: string) => {
    // Implement customer suspension
    console.log('Suspending customer:', customerId);
    // Update customer status in database
    // Disable all user sessions for that customer
  };

  const refundCustomer = async (customerId: string) => {
    // Implement refund process
    console.log('Processing refund for customer:', customerId);
  };

  const exportCustomers = () => {
    // Export customer data to CSV
    const csvContent = customers.map(customer => 
      `${customer.name},${customer.email},${customer.plan_type},${customer.status},${customer.mrr}`
    ).join('\n');
    
    const blob = new Blob([`Name,Email,Plan,Status,MRR\n${csvContent}`], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'customers.csv';
    a.click();
  };

  if (sessionLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isOwner) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Alert className="max-w-md">
          <Crown className="h-4 w-4" />
          <AlertDescription>Access denied. System owner privileges required.</AlertDescription>
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
                <div className="icon-button bg-gradient-to-r from-purple-500 to-indigo-600 mr-3">
                  <Crown className="h-6 w-6 text-white" />
                </div>
                <h1 className="text-xl font-semibold text-gray-900">Family Vault Enterprise - Owner Console</h1>
              </div>
              <div className="flex items-center space-x-4">
                <Badge variant="outline" className="text-green-600 border-green-600">
                  System Owner
                </Badge>
                <Link href="/dashboard">
                  <Button variant="outline" size="sm">User Dashboard</Button>
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Business Overview</h1>
            <p className="text-lg text-gray-600">Manage your Family Vault Enterprise SaaS business</p>
          </div>

          {/* Revenue & Growth Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <CardContent className="flex items-center p-6">
                <div className="icon-button bg-green-500">
                  <DollarSign className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-2xl font-bold text-green-900">${metrics.mrr.toFixed(2)}</p>
                  <p className="text-sm text-green-700">Monthly Recurring Revenue</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <CardContent className="flex items-center p-6">
                <div className="icon-button bg-blue-500">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-2xl font-bold text-blue-900">{metrics.total_customers}</p>
                  <p className="text-sm text-blue-700">Total Customers</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
              <CardContent className="flex items-center p-6">
                <div className="icon-button bg-purple-500">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-2xl font-bold text-purple-900">{metrics.active_customers}</p>
                  <p className="text-sm text-purple-700">Active Today</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
              <CardContent className="flex items-center p-6">
                <div className="icon-button bg-orange-500">
                  <Server className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-2xl font-bold text-orange-900">{metrics.uptime}</p>
                  <p className="text-sm text-orange-700">System Uptime</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Navigation Tabs */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'dashboard', name: 'Business Dashboard', icon: BarChart3 },
                { id: 'customers', name: 'Customer Management', icon: Users },
                { id: 'subscriptions', name: 'Subscriptions & Billing', icon: CreditCard },
                { id: 'system', name: 'System Health', icon: Server },
                { id: 'analytics', name: 'Analytics', icon: LineChart }
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`${
                      activeTab === tab.id
                        ? 'border-purple-500 text-purple-600'
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
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Revenue Trends</CardTitle>
                    <CardDescription>Monthly revenue and growth</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Current MRR</span>
                        <span className="font-semibold text-green-600">${metrics.mrr.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Churn Rate</span>
                        <span className="font-semibold text-red-600">{metrics.churn_rate}%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Trial Conversions</span>
                        <span className="font-semibold text-blue-600">67%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>System Performance</CardTitle>
                    <CardDescription>Infrastructure and usage metrics</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">API Requests (24h)</span>
                        <span className="font-semibold">{metrics.api_requests_24h.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Storage Used</span>
                        <span className="font-semibold">{metrics.storage_used_gb} GB</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Database Size</span>
                        <span className="font-semibold">{metrics.database_size_mb} MB</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {activeTab === 'customers' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Customer Management</h2>
                <div className="space-x-2">
                  <Button onClick={exportCustomers} variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                  </Button>
                  <Button onClick={loadOwnerData} variant="outline" size="sm">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                </div>
              </div>
              
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plan</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">MRR</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Members</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Support</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {customers.map((customer) => (
                          <tr key={customer.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                <div className="text-sm font-medium text-gray-900">{customer.name}</div>
                                <div className="text-sm text-gray-500">{customer.email}</div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Badge variant={customer.plan_type === 'enterprise' ? 'default' : 'secondary'}>
                                {customer.plan_type}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Badge variant={
                                customer.status === 'active' ? 'default' :
                                customer.status === 'trial' ? 'secondary' : 'destructive'
                              }>
                                {customer.status}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              ${customer.mrr}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {customer.members_count}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {customer.support_tickets} tickets
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                              <Button size="sm" variant="outline">
                                <Mail className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => suspendCustomer(customer.id)}>
                                <UserX className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="outline">
                                <Settings className="h-4 w-4" />
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

          {/* Add other tab content as needed */}
        </div>
      </div>
    </>
  );
}