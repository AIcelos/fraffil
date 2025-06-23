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
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    name: '',
    email: '',
    phone: '',
    instagram: '',
    tiktok: '',
    youtube: '',
    commission: 10.00,
    notes: '',
    ref: ''
  });
  const [isSendingInvite, setIsSendingInvite] = useState(false);
  const [inviteResult, setInviteResult] = useState(null);
  const router = useRouter();

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [activeFilters, setActiveFilters] = useState({});
  const [searchResults, setSearchResults] = useState(null);
  const [searchStats, setSearchStats] = useState(null);
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');

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

  const handleOpenInviteModal = () => {
    setIsInviteModalOpen(true);
    setInviteResult(null);
    // Genereer een unieke ref code
    const uniqueRef = 'inf_' + Math.random().toString(36).substr(2, 8);
    setInviteForm(prev => ({ ...prev, ref: uniqueRef }));
  };

  const handleCloseInviteModal = () => {
    setIsInviteModalOpen(false);
    setInviteForm({
      name: '',
      email: '',
      phone: '',
      instagram: '',
      tiktok: '',
      youtube: '',
      commission: 10.00,
      notes: '',
      ref: ''
    });
    setInviteResult(null);
  };

  const handleInviteFormChange = (e) => {
    const { name, value } = e.target;
    setInviteForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSendInvitation = async (e) => {
    e.preventDefault();
    setIsSendingInvite(true);
    setInviteResult(null);

    try {
      const response = await fetch('/api/admin/send-invitation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify(inviteForm)
      });

      const result = await response.json();

      if (result.success) {
        setInviteResult({
          type: 'success',
          message: result.message,
          credentials: result.credentials,
          influencer: result.influencer
        });
        
        // Refresh dashboard data to show new user
        setTimeout(() => {
          loadDashboardData();
        }, 1000);
      } else {
        setInviteResult({
          type: 'error',
          message: result.error
        });
      }
    } catch (error) {
      console.error('❌ Send invitation error:', error);
      setInviteResult({
        type: 'error',
        message: 'Failed to send invitation. Please try again.'
      });
    } finally {
      setIsSendingInvite(false);
    }
  };

  const handleSearch = async (query = searchQuery) => {
    if (!query.trim()) {
      setSearchResults(null);
      setSearchStats(null);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch('/api/admin/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify({ query })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setSearchResults(data.results);
          setSearchStats(data.stats);
        }
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleFilterChange = (filterKey, value) => {
    setActiveFilters(prev => ({
      ...prev,
      [filterKey]: value
    }));
  };

  const clearFilters = () => {
    setActiveFilters({});
    setSearchResults(null);
    setSearchStats(null);
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
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
                <button
                  onClick={() => router.push('/admin/bulk-operations')}
                  className="flex items-center px-3 py-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition-colors text-sm font-medium"
                  title="Bulk Operations"
                >
                  <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  Bulk
                </button>
                
                <button
                  onClick={() => router.push('/admin/invoices')}
                  className="flex items-center px-3 py-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition-colors text-sm font-medium"
                  title="Invoice Management"
                >
                  <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Facturen
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
                onClick={handleOpenInviteModal}
                className="flex items-center px-3 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span className="hidden sm:inline">Uitnodiging Sturen</span>
                <span className="sm:hidden">Uitnodigen</span>
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
              
              <button
                onClick={() => router.push('/admin/email-templates')}
                className="flex items-center px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                <span className="hidden sm:inline">Template Editor</span>
                <span className="sm:hidden">Templates</span>
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

        {/* Search & Filter Section */}
        <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 mb-6">
          <div className="p-6">
            {/* Search Bar */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Zoek influencers op naam, email, ref, social media..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    // Auto-search after 500ms delay
                    clearTimeout(window.searchTimeout);
                    window.searchTimeout = setTimeout(() => handleSearch(e.target.value), 500);
                  }}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="block w-full pl-10 pr-3 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                {isSearching && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                  </div>
                )}
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    showFilters || Object.keys(activeFilters).length > 0
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                  Filters
                  {Object.keys(activeFilters).length > 0 && (
                    <span className="ml-2 bg-blue-500 text-white text-xs rounded-full px-2 py-1">
                      {Object.keys(activeFilters).length}
                    </span>
                  )}
                </button>
                
                <button
                  onClick={handleSearch}
                  disabled={isSearching}
                  className="flex items-center px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  Zoeken
                </button>
                
                {(searchResults || Object.keys(activeFilters).length > 0) && (
                  <button
                    onClick={clearFilters}
                    className="flex items-center px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Reset
                  </button>
                )}
              </div>
            </div>

            {/* Advanced Filters */}
            {showFilters && (
              <div className="border-t border-gray-700 pt-6">
                <h3 className="text-sm font-medium text-white mb-4">Geavanceerde Filters</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  
                  {/* Status Filter */}
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-2">Status</label>
                    <select
                      value={activeFilters.status?.[0] || ''}
                      onChange={(e) => handleFilterChange('status', e.target.value ? [e.target.value] : null)}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Alle statussen</option>
                      <option value="active">Actief</option>
                      <option value="inactive">Inactief</option>
                      <option value="pending">In behandeling</option>
                    </select>
                  </div>

                  {/* Commission Range */}
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-2">Commissie Min %</label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="0.0"
                      value={activeFilters.commissionMin || ''}
                      onChange={(e) => handleFilterChange('commissionMin', e.target.value ? parseFloat(e.target.value) : null)}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-2">Commissie Max %</label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="20.0"
                      value={activeFilters.commissionMax || ''}
                      onChange={(e) => handleFilterChange('commissionMax', e.target.value ? parseFloat(e.target.value) : null)}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Sales Range */}
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-2">Min Verkopen</label>
                    <input
                      type="number"
                      placeholder="0"
                      value={activeFilters.salesMin || ''}
                      onChange={(e) => handleFilterChange('salesMin', e.target.value ? parseInt(e.target.value) : null)}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-2">Max Verkopen</label>
                    <input
                      type="number"
                      placeholder="100"
                      value={activeFilters.salesMax || ''}
                      onChange={(e) => handleFilterChange('salesMax', e.target.value ? parseInt(e.target.value) : null)}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Revenue Range */}
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-2">Min Omzet €</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={activeFilters.revenueMin || ''}
                      onChange={(e) => handleFilterChange('revenueMin', e.target.value ? parseFloat(e.target.value) : null)}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-2">Max Omzet €</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="10000.00"
                      value={activeFilters.revenueMax || ''}
                      onChange={(e) => handleFilterChange('revenueMax', e.target.value ? parseFloat(e.target.value) : null)}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Performance Level */}
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-2">Performance</label>
                    <select
                      value={activeFilters.performanceLevel?.[0] || ''}
                      onChange={(e) => handleFilterChange('performanceLevel', e.target.value ? [e.target.value] : null)}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Alle levels</option>
                      <option value="none">Geen verkopen</option>
                      <option value="low">Laag (1-2)</option>
                      <option value="medium">Gemiddeld (3-5)</option>
                      <option value="high">Hoog (6+)</option>
                    </select>
                  </div>
                  
                </div>

                {/* Social Media Filters */}
                <div className="mt-4 pt-4 border-t border-gray-700">
                  <h4 className="text-xs font-medium text-gray-400 mb-3">Social Media Platforms</h4>
                  <div className="flex flex-wrap gap-3">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={activeFilters.hasInstagram || false}
                        onChange={(e) => handleFilterChange('hasInstagram', e.target.checked || null)}
                        className="rounded border-gray-600 text-blue-600 focus:ring-blue-500 focus:ring-offset-0 bg-gray-700"
                      />
                      <span className="ml-2 text-sm text-gray-300">Instagram</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={activeFilters.hasTiktok || false}
                        onChange={(e) => handleFilterChange('hasTiktok', e.target.checked || null)}
                        className="rounded border-gray-600 text-blue-600 focus:ring-blue-500 focus:ring-offset-0 bg-gray-700"
                      />
                      <span className="ml-2 text-sm text-gray-300">TikTok</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={activeFilters.hasYoutube || false}
                        onChange={(e) => handleFilterChange('hasYoutube', e.target.checked || null)}
                        className="rounded border-gray-600 text-blue-600 focus:ring-blue-500 focus:ring-offset-0 bg-gray-700"
                      />
                      <span className="ml-2 text-sm text-gray-300">YouTube</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={activeFilters.profileComplete || false}
                        onChange={(e) => handleFilterChange('profileComplete', e.target.checked || null)}
                        className="rounded border-gray-600 text-blue-600 focus:ring-blue-500 focus:ring-offset-0 bg-gray-700"
                      />
                      <span className="ml-2 text-sm text-gray-300">Compleet Profiel</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Search Stats */}
            {searchStats && (
              <div className="mt-6 pt-6 border-t border-gray-700">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-400">{searchStats.totalResults}</p>
                    <p className="text-xs text-gray-400">Resultaten</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-400">{formatCurrency(searchStats.totalRevenue)}</p>
                    <p className="text-xs text-gray-400">Totale Omzet</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-purple-400">{formatCurrency(searchStats.totalCommission)}</p>
                    <p className="text-xs text-gray-400">Totale Commissie</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-yellow-400">{searchStats.avgCommission.toFixed(1)}%</p>
                    <p className="text-xs text-gray-400">Gem. Commissie</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

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
                  <th className="px-6 py-3 text-left">
                    <button
                      onClick={() => handleSort('name')}
                      className="flex items-center text-xs font-medium text-gray-300 uppercase tracking-wider hover:text-white transition-colors"
                    >
                      Influencer
                      {sortBy === 'name' && (
                        <svg className={`ml-1 h-3 w-3 ${sortOrder === 'asc' ? 'rotate-0' : 'rotate-180'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                      )}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left">
                    <button
                      onClick={() => handleSort('email')}
                      className="flex items-center text-xs font-medium text-gray-300 uppercase tracking-wider hover:text-white transition-colors"
                    >
                      Email
                      {sortBy === 'email' && (
                        <svg className={`ml-1 h-3 w-3 ${sortOrder === 'asc' ? 'rotate-0' : 'rotate-180'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                      )}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left">
                    <button
                      onClick={() => handleSort('totalSales')}
                      className="flex items-center text-xs font-medium text-gray-300 uppercase tracking-wider hover:text-white transition-colors"
                    >
                      Sales
                      {sortBy === 'totalSales' && (
                        <svg className={`ml-1 h-3 w-3 ${sortOrder === 'asc' ? 'rotate-0' : 'rotate-180'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                      )}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left">
                    <button
                      onClick={() => handleSort('totalRevenue')}
                      className="flex items-center text-xs font-medium text-gray-300 uppercase tracking-wider hover:text-white transition-colors"
                    >
                      Revenue
                      {sortBy === 'totalRevenue' && (
                        <svg className={`ml-1 h-3 w-3 ${sortOrder === 'asc' ? 'rotate-0' : 'rotate-180'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                      )}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left">
                    <button
                      onClick={() => handleSort('commission')}
                      className="flex items-center text-xs font-medium text-gray-300 uppercase tracking-wider hover:text-white transition-colors"
                    >
                      Commission
                      {sortBy === 'commission' && (
                        <svg className={`ml-1 h-3 w-3 ${sortOrder === 'asc' ? 'rotate-0' : 'rotate-180'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                      )}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left">
                    <button
                      onClick={() => handleSort('status')}
                      className="flex items-center text-xs font-medium text-gray-300 uppercase tracking-wider hover:text-white transition-colors"
                    >
                      Status
                      {sortBy === 'status' && (
                        <svg className={`ml-1 h-3 w-3 ${sortOrder === 'asc' ? 'rotate-0' : 'rotate-180'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                      )}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left">
                    <button
                      onClick={() => handleSort('created_at')}
                      className="flex items-center text-xs font-medium text-gray-300 uppercase tracking-wider hover:text-white transition-colors"
                    >
                      Created
                      {sortBy === 'created_at' && (
                        <svg className={`ml-1 h-3 w-3 ${sortOrder === 'asc' ? 'rotate-0' : 'rotate-180'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                      )}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-gray-800 divide-y divide-gray-700">
                {/* Show search results if available, otherwise show regular influencers */}
                {(searchResults || influencers).length > 0 ? (searchResults || influencers).map((influencer, index) => (
                  <tr key={index} className="hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 bg-gray-600 rounded-full flex items-center justify-center">
                          <span className="text-gray-200 font-medium text-sm">
                            {(influencer.name || influencer.ref || 'U').charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-white">{influencer.name || influencer.ref}</div>
                          <div className="text-sm text-gray-400">filright.com?ref={influencer.ref || influencer.name}</div>
                          {/* Performance indicator */}
                          {influencer.performanceLevel && (
                            <div className="flex items-center mt-1">
                              <div className={`h-2 w-2 rounded-full mr-2 ${
                                influencer.performanceLevel === 'high' ? 'bg-green-400' :
                                influencer.performanceLevel === 'medium' ? 'bg-yellow-400' :
                                influencer.performanceLevel === 'low' ? 'bg-orange-400' : 'bg-gray-400'
                              }`}></div>
                              <span className="text-xs text-gray-500 capitalize">{influencer.performanceLevel}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-300">{influencer.email || 'Geen email'}</div>
                      {influencer.phone && (
                        <div className="text-sm text-gray-500">{influencer.phone}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-white">{influencer.totalSales || 0}</div>
                      {influencer.lastSaleDate && (
                        <div className="text-xs text-gray-500">Laatst: {influencer.lastSaleDate}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-green-400">{formatCurrency(influencer.totalRevenue || 0)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-300">
                        {parseFloat(influencer.commission || 0).toFixed(1)}%
                      </div>
                      <div className="text-sm font-medium text-purple-400">
                        {formatCurrency(influencer.totalCommission || 0)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        influencer.status === 'active' ? 'bg-green-900 text-green-200' :
                        influencer.status === 'inactive' ? 'bg-red-900 text-red-200' :
                        'bg-yellow-900 text-yellow-200'
                      }`}>
                        {influencer.status || 'active'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                      {influencer.created_at ? new Date(influencer.created_at).toLocaleDateString('nl-NL') : 'Onbekend'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleEditUser(influencer)}
                        className="text-blue-400 hover:text-blue-300 mr-3"
                      >
                        Bewerken
                      </button>
                      {/* Social Media Links */}
                      <div className="flex space-x-2 mt-2">
                        {influencer.instagram && (
                          <a href={influencer.instagram} target="_blank" rel="noopener noreferrer" 
                             className="text-pink-400 hover:text-pink-300" title="Instagram">
                            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                            </svg>
                          </a>
                        )}
                        {influencer.tiktok && (
                          <a href={influencer.tiktok} target="_blank" rel="noopener noreferrer" 
                             className="text-gray-300 hover:text-white" title="TikTok">
                            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-.88-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/>
                            </svg>
                          </a>
                        )}
                        {influencer.youtube && (
                          <a href={influencer.youtube} target="_blank" rel="noopener noreferrer" 
                             className="text-red-400 hover:text-red-300" title="YouTube">
                            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                            </svg>
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="8" className="px-6 py-12 text-center">
                      <div className="text-gray-400">
                        {searchResults !== null ? (
                          <div>
                            <svg className="mx-auto h-12 w-12 text-gray-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <p className="text-lg font-medium text-gray-300 mb-2">Geen resultaten gevonden</p>
                            <p className="text-sm">Probeer andere zoektermen of pas je filters aan</p>
                          </div>
                        ) : (
                          <div>
                            <svg className="mx-auto h-12 w-12 text-gray-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            <p className="text-lg font-medium text-gray-300 mb-2">Geen influencers gevonden</p>
                            <p className="text-sm">Voeg je eerste influencer toe om te beginnen</p>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Results Summary */}
          <div className="px-6 py-4 border-t border-gray-700 bg-gray-800">
            <div className="flex justify-between items-center text-sm text-gray-400">
              <div>
                {searchResults ? (
                  <span>Toont {searchResults.length} van {searchStats?.totalResults || 0} zoekresultaten</span>
                ) : (
                  <span>Toont {influencers.length} influencers</span>
                )}
              </div>
              <div className="flex items-center space-x-4">
                {searchResults && (
                  <span className="text-green-400">
                    Gefilterd: {formatCurrency(searchStats?.totalRevenue || 0)} omzet
                  </span>
                )}
                <span className="text-blue-400">
                  Laatst bijgewerkt: {new Date().toLocaleTimeString('nl-NL')}
                </span>
              </div>
            </div>
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

      {/* Invitation Modal */}
      <InvitationModal
        isOpen={isInviteModalOpen}
        onClose={handleCloseInviteModal}
        formData={inviteForm}
        onChange={handleInviteFormChange}
        onSubmit={handleSendInvitation}
        isSending={isSendingInvite}
        result={inviteResult}
      />
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

// Invitation Modal Component
const InvitationModal = ({ isOpen, onClose, formData, onChange, onSubmit, isSending, result }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">Uitnodiging Sturen</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="text-gray-400 mt-2">
            Stuur een uitnodiging naar een nieuwe influencer met automatische account aanmaak en email.
          </p>
        </div>

        <form onSubmit={onSubmit} className="p-6 space-y-6">
          {/* Result Message */}
          {result && (
            <div className={`p-4 rounded-lg border ${
              result.type === 'success' 
                ? 'bg-green-900/20 border-green-800 text-green-300' 
                : 'bg-red-900/20 border-red-800 text-red-300'
            }`}>
              <div className="flex items-center">
                {result.type === 'success' ? (
                  <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
                <span className="font-medium">{result.message}</span>
              </div>
              
              {result.type === 'success' && result.credentials && (
                <div className="mt-3 p-3 bg-gray-700 rounded-lg">
                  <p className="text-sm text-gray-300 mb-2">Account gegevens:</p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-400">Username:</span>
                      <span className="ml-2 text-white font-mono">{result.credentials.username}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Password:</span>
                      <span className="ml-2 text-white font-mono">{result.credentials.password}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Naam *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={onChange}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Email *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={onChange}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Referral Code *
              </label>
              <input
                type="text"
                name="ref"
                value={formData.ref}
                onChange={onChange}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                required
                readOnly
              />
              <p className="text-xs text-gray-400 mt-1">Automatisch gegenereerd</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Commission (%)
              </label>
              <input
                type="number"
                name="commission"
                value={formData.commission}
                onChange={onChange}
                step="0.01"
                min="0"
                max="100"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Telefoon
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={onChange}
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
                onChange={onChange}
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
                onChange={onChange}
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
                onChange={onChange}
                placeholder="@channel"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Notities
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={onChange}
              rows="3"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Extra informatie over deze influencer..."
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-300 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
              disabled={isSending}
            >
              Annuleren
            </button>
            <button
              type="submit"
              disabled={isSending}
              className="px-6 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {isSending ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Uitnodiging versturen...
                </>
              ) : (
                <>
                  <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Uitnodiging Sturen
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}; 