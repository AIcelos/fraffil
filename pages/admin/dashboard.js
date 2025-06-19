import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

export default function AdminDashboard() {
  const [systemStats, setSystemStats] = useState(null);
  const [influencers, setInfluencers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminUser, setAdminUser] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const adminToken = localStorage.getItem('adminToken');
    const storedAdminUser = localStorage.getItem('adminUser');
    
    if (adminToken && storedAdminUser) {
      setAdminUser(JSON.parse(storedAdminUser));
      setIsAuthenticated(true);
      loadDashboardData();
    } else {
      router.push('/admin/login');
    }
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      
      // Load stats from new Google Sheets integrated API
      try {
        const statsResponse = await fetch('/api/admin/stats', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
          }
        });
        
        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          
          if (statsData.success) {
            const stats = statsData.data;
            
            console.log('🔍 Admin Dashboard: Stats from Google Sheets + DB:', stats);
            
            setSystemStats(stats);
            setInfluencers(stats.influencers || []);
            setError(null);
            console.log('✅ Admin Dashboard loaded with Google Sheets data:', {
              totalRevenue: stats.totalRevenue?.toFixed(2),
              totalOrders: stats.totalOrders,
              totalInfluencers: stats.totalInfluencers,
              dataSource: statsData.dataSource
            });
            return;
          }
        }
      } catch (apiError) {
        console.log('⚠️ Stats API not available, trying fallback:', apiError.message);
      }
      
      // Fallback to users API if stats API fails
      try {
        const usersResponse = await fetch('/api/admin/users-db', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
          }
        });
        
        if (usersResponse.ok) {
          const usersData = await usersResponse.json();
          
          if (usersData.success) {
            const users = usersData.users || [];
            
            console.log('🔍 Dashboard: Fallback to users data:', users);
            
            // Calculate basic stats from database users (without Google Sheets)
            const stats = {
              totalRevenue: 0,
              totalOrders: 0,
              totalCommission: 0,
              activeInfluencers: users.filter(user => user.status === 'active').length,
              totalInfluencers: users.length,
              influencers: users.map(user => ({
                name: user.ref,
                totalSales: 0,
                totalRevenue: 0,
                totalCommission: 0,
                lastSale: null,
                recentOrders: [],
                email: user.email || '',
                phone: user.phone || '',
                commission: parseFloat(user.commission) || 6.00,
                status: user.status || 'active',
                instagram: user.instagram || '',
                tiktok: user.tiktok || '',
                youtube: user.youtube || '',
                notes: user.notes || '',
                profileComplete: true,
                created_at: user.created_at
              }))
            };
            
            setSystemStats(stats);
            setInfluencers(stats.influencers);
            setError(null);
            console.log('✅ Dashboard loaded from fallback database:', users.length, 'users');
            return;
          }
        }
      } catch (fallbackError) {
        console.log('⚠️ Fallback API also failed:', fallbackError.message);
      }
      
      // Final fallback to empty data
      const emptyStats = {
        totalRevenue: 0,
        totalOrders: 0,
        totalCommission: 0,
        activeInfluencers: 0,
        totalInfluencers: 0,
        influencers: []
      };
      
      setSystemStats(emptyStats);
      setInfluencers([]);
      setError(null);
      console.log('📊 Using empty fallback data');
      
    } catch (error) {
      console.error('❌ Dashboard load error:', error);
      setSystemStats({
        totalRevenue: 0,
        totalOrders: 0,
        totalCommission: 0,
        activeInfluencers: 0,
        totalInfluencers: 0,
        influencers: []
      });
      setInfluencers([]);
      setError(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    router.push('/admin/login');
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setIsEditModalOpen(true);
  };

  const handleSaveUser = async (updatedUser) => {
    try {
      const response = await fetch('/api/admin/users-db', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify(updatedUser)
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          // Refresh dashboard data
          loadDashboardData();
          setIsEditModalOpen(false);
          setEditingUser(null);
          console.log('✅ User updated successfully');
        }
      } else {
        console.error('❌ Failed to update user');
      }
    } catch (error) {
      console.error('❌ Error updating user:', error);
    }
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditingUser(null);
  };

  if (!isAuthenticated || isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-300 mx-auto"></div>
          <p className="mt-4 text-gray-300">
            {!isAuthenticated ? 'Authenticatie controleren...' : 'Dashboard laden uit Neon PostgreSQL database...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 shadow-sm border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-gray-700 rounded-lg flex items-center justify-center">
                <svg className="h-5 w-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="ml-3">
                <h1 className="text-xl font-semibold text-white">Filright Admin Panel</h1>
                <p className="text-sm text-gray-400">Neon PostgreSQL Database - Live Dashboard</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Admin Navigation Menu */}
              <div className="hidden md:flex items-center space-x-1">
                <button
                  onClick={() => router.push('/admin/users')}
                  className="flex items-center px-3 py-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition-colors text-sm font-medium"
                  title="Influencer Management"
                >
                  <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                  Influencers
                </button>
                <button
                  onClick={() => router.push('/admin/manage-admins')}
                  className="flex items-center px-3 py-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition-colors text-sm font-medium"
                  title="Admin Management"
                >
                  <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  Admins
                </button>
                <button
                  onClick={() => router.push('/admin/email-tester')}
                  className="flex items-center px-3 py-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition-colors text-sm font-medium"
                  title="Email Templates"
                >
                  <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Email
                </button>
                
                {/* Divider */}
                <div className="h-6 w-px bg-gray-600 mx-2"></div>
                
                {/* Quick Actions */}
                <button
                  onClick={() => window.open('/api/test-email', '_blank')}
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                  title="API Test"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
                <button
                  onClick={loadDashboardData}
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                  title="Refresh Data"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              </div>
              
              <div className="text-right">
                <p className="text-sm font-medium text-white">{adminUser?.username}</p>
                <p className="text-xs text-gray-400">Administrator</p>
              </div>
              <button
                onClick={handleLogout}
                className="bg-gray-700 hover:bg-gray-600 text-gray-200 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Admin Navigation Bar */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-3 space-y-3 sm:space-y-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-sm font-medium text-gray-400 mr-2 hidden sm:block">Quick Actions:</h2>
              
              <button
                onClick={() => router.push('/admin/manage-admins')}
                className="flex items-center px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span className="hidden sm:inline">Beheer Admins</span>
                <span className="sm:hidden">Admins</span>
              </button>
              
              <button
                onClick={() => router.push('/admin/users')}
                className="flex items-center px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
                <span className="hidden sm:inline">Nieuwe Influencer</span>
                <span className="sm:hidden">Nieuw</span>
              </button>
              
              <button
                onClick={() => router.push('/admin/email-tester')}
                className="flex items-center px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span className="hidden sm:inline">Email Test</span>
                <span className="sm:hidden">Email</span>
              </button>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-400 hidden sm:inline">Database Status:</span>
              <div className="flex items-center">
                <div className="h-2 w-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="ml-1 text-xs text-green-400">Online</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-6 bg-red-900/20 border border-red-800 text-red-300 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* System Overview Cards */}
        {systemStats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-700">
              <div className="flex items-center">
                <div className="p-2 bg-gray-700 rounded-lg">
                  <svg className="h-6 w-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-400">Total Revenue</p>
                  <p className="text-2xl font-bold text-white">{formatCurrency(systemStats.totalRevenue)}</p>
                </div>
              </div>
            </div>

            <div className="bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-700">
              <div className="flex items-center">
                <div className="p-2 bg-gray-700 rounded-lg">
                  <svg className="h-6 w-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M8 11v6h8v-6M8 11H6a2 2 0 00-2 2v6a2 2 0 002 2h12a2 2 0 002-2v-6a2 2 0 00-2-2h-2" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-400">Total Orders</p>
                  <p className="text-2xl font-bold text-white">{systemStats.totalOrders}</p>
                </div>
              </div>
            </div>

            <div className="bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-700">
              <div className="flex items-center">
                <div className="p-2 bg-gray-700 rounded-lg">
                  <svg className="h-6 w-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-400">Active Influencers</p>
                  <p className="text-2xl font-bold text-white">{systemStats.activeInfluencers}</p>
                </div>
              </div>
            </div>

            <div className="bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-700">
              <div className="flex items-center">
                <div className="p-2 bg-gray-700 rounded-lg">
                  <svg className="h-6 w-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-400">Total Users</p>
                  <p className="text-2xl font-bold text-white">{systemStats.totalInfluencers}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Additional Stats Row */}
        {systemStats && systemStats.totalCommission > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-700">
              <div className="flex items-center">
                <div className="p-2 bg-green-700 rounded-lg">
                  <svg className="h-6 w-6 text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-400">Total Commission</p>
                  <p className="text-2xl font-bold text-green-300">{formatCurrency(systemStats.totalCommission)}</p>
                </div>
              </div>
            </div>

            <div className="bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-700">
              <div className="flex items-center">
                <div className="p-2 bg-blue-700 rounded-lg">
                  <svg className="h-6 w-6 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-400">Average Order</p>
                  <p className="text-2xl font-bold text-blue-300">
                    {systemStats.totalOrders > 0 ? formatCurrency(systemStats.totalRevenue / systemStats.totalOrders) : '€0,00'}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-700">
              <div className="flex items-center">
                <div className="p-2 bg-purple-700 rounded-lg">
                  <svg className="h-6 w-6 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-400">Commission Rate</p>
                  <p className="text-2xl font-bold text-purple-300">
                    {systemStats.totalRevenue > 0 ? `${((systemStats.totalCommission / systemStats.totalRevenue) * 100).toFixed(1)}%` : '0%'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Influencers Table */}
        <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-700">
          <div className="px-6 py-4 border-b border-gray-700">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-semibold text-white">Influencer Overzicht</h2>
                <p className="text-sm text-gray-400 mt-1">Live data uit PostgreSQL database</p>
              </div>
              <div className="flex space-x-3">
                <button 
                  onClick={() => router.push('/admin/users')}
                  className="bg-green-600 hover:bg-green-700 text-white p-2 rounded-lg transition-colors flex items-center"
                  title="Nieuwe Influencer Toevoegen"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-700">
              <thead className="bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Influencer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Sales
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Revenue
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Commission
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-gray-800 divide-y divide-gray-700">
                {influencers.length > 0 ? influencers.map((influencer, index) => (
                  <tr key={index} className="hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 bg-gray-600 rounded-full flex items-center justify-center">
                          <span className="text-gray-200 font-medium text-sm">
                            {influencer.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-white">{influencer.name}</div>
                          <div className="text-sm text-gray-400">filright.com?ref={influencer.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-200">{influencer.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-white">{influencer.totalSales || 0}</div>
                      <div className="text-xs text-gray-400">orders</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-white">{formatCurrency(influencer.totalRevenue || 0)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-green-300">{formatCurrency(influencer.totalCommission || 0)}</div>
                      <div className="text-xs text-gray-400">{influencer.commission}% rate</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        influencer.status === 'active' 
                          ? 'bg-green-900 text-green-200' 
                          : 'bg-red-900 text-red-200'
                      }`}>
                        {influencer.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-400">
                        {influencer.created_at ? new Date(influencer.created_at).toLocaleDateString('nl-NL') : 'Onbekend'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleEditUser(influencer)}
                        className="text-blue-400 hover:text-blue-300 mr-3"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="8" className="px-6 py-8 text-center">
                      <div className="text-gray-400">
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <h3 className="mt-2 text-sm font-medium text-gray-300">Geen influencers gevonden</h3>
                        <p className="mt-1 text-sm text-gray-400">Voeg je eerste influencer toe om te beginnen.</p>
                        <div className="mt-6">
                          <button
                            onClick={() => router.push('/admin/users')}
                            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                          >
                            <svg className="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Nieuwe Influencer
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Edit User Modal */}
      {isEditModalOpen && editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4 border border-gray-700">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-white">Edit User: {editingUser.name}</h3>
              <button
                onClick={handleCloseEditModal}
                className="text-gray-400 hover:text-white"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <EditUserForm 
              user={editingUser}
              onSave={handleSaveUser}
              onCancel={handleCloseEditModal}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// Edit User Form Component
const EditUserForm = ({ user, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    ref: user.name || '',
    name: user.name || '',
    email: user.email || '',
    phone: user.phone || '',
    commission: user.commission || 6.00,
    status: user.status || 'active',
    instagram: user.instagram || '',
    tiktok: user.tiktok || '',
    youtube: user.youtube || '',
    notes: user.notes || ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Referral Code
          </label>
          <input
            type="text"
            name="ref"
            value={formData.ref}
            onChange={handleChange}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Name
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
          Email
        </label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Commission (%)
          </label>
          <input
            type="number"
            name="commission"
            value={formData.commission}
            onChange={handleChange}
            step="0.01"
            min="0"
            max="100"
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Status
          </label>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="pending">Pending</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
          Phone
        </label>
        <input
          type="tel"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Instagram
          </label>
          <input
            type="text"
            name="instagram"
            value={formData.instagram}
            onChange={handleChange}
            placeholder="@username"
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            TikTok
          </label>
          <input
            type="text"
            name="tiktok"
            value={formData.tiktok}
            onChange={handleChange}
            placeholder="@username"
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            YouTube
          </label>
          <input
            type="text"
            name="youtube"
            value={formData.youtube}
            onChange={handleChange}
            placeholder="@channel"
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
          Notes
        </label>
        <textarea
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          rows="3"
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Additional notes..."
        />
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-gray-300 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          Save Changes
        </button>
      </div>
    </form>
  );
}; 