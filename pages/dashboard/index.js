import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

const Dashboard = () => {
  const [influencer, setInfluencer] = useState(null);
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showLinkGuide, setShowLinkGuide] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    instagram: '',
    tiktok: '',
    youtube: '',
    website: '',
    bank_account: '',
    bank_name: '',
    account_holder: '',
    preferred_payment: 'monthly'
  });
  const [profileLoading, setProfileLoading] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState('');
  const router = useRouter();

  useEffect(() => {
    // Check authentication - only client-side
    if (typeof window !== 'undefined') {
      const influencerData = localStorage.getItem('influencer');
      
      console.log('🔍 Checking authentication, localStorage data:', influencerData);
      
      if (!influencerData) {
        console.log('❌ No influencer data found, redirecting to login');
        router.push('/dashboard/login');
        return;
      }

      try {
        const userData = JSON.parse(influencerData);
        console.log('✅ User data parsed:', userData);
        setInfluencer(userData);
        setIsAuthenticated(true);
      } catch (error) {
        console.error('❌ Error parsing user data:', error);
        localStorage.removeItem('influencer');
        router.push('/dashboard/login');
      }
    }
  }, [router]);

  useEffect(() => {
    if (isAuthenticated && influencer) {
      loadDashboardData();
      loadProfile();
    }
  }, [isAuthenticated, influencer]);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/dashboard/stats?influencer=${influencer.username}`);
      const data = await response.json();
      
      if (data.success) {
        setStats(data.data);
      } else {
        setError('Failed to load dashboard data');
      }
    } catch (error) {
      console.error('Dashboard load error:', error);
      setError('Network error loading dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  const loadProfile = async () => {
    try {
      const response = await fetch(`/api/influencer/profile/${influencer.username}`);
      if (response.ok) {
        const data = await response.json();
        setProfile(prev => ({ ...prev, ...data.profile }));
      }
    } catch (error) {
      console.error('Profile load error:', error);
    }
  };

  const saveProfile = async () => {
    try {
      setProfileLoading(true);
      const response = await fetch(`/api/influencer/profile/${influencer.username}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile)
      });
      
      if (response.ok) {
        setShowProfileModal(false);
        // Refresh dashboard data
        loadDashboardData();
      } else {
        alert('Er ging iets mis bij het opslaan van je profiel');
      }
    } catch (error) {
      console.error('Profile save error:', error);
      alert('Netwerkfout bij opslaan profiel');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('influencer');
    router.push('/dashboard/login');
  };

  const copyToClipboard = async (text, type) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopyFeedback(`${type} gekopieerd!`);
      setTimeout(() => setCopyFeedback(''), 2000);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  const shareToInstagram = () => {
    const text = `Check out Filright! 🔥 ${getReferralLink()}`;
    const url = `https://www.instagram.com/create/story/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const shareToTikTok = () => {
    const text = `Amazing products at Filright! ${getReferralLink()}`;
    const url = `https://www.tiktok.com/share?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const shareToYouTube = () => {
    const text = `Check out Filright - ${getReferralLink()}`;
    const url = `https://www.youtube.com/create?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const shareViaEmail = () => {
    const subject = 'Check out Filright!';
    const body = `Hi!\n\nI wanted to share this amazing product with you: ${getReferralLink()}\n\nCheck it out!\n\nBest regards`;
    const url = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(url);
  };

  const getReferralLink = () => {
    return `https://filright.com?ref=${influencer?.username}`;
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Authenticating...</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Dashboard</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={loadDashboardData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">F</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  Welkom, {influencer?.name || influencer?.username}! 👋
                </h1>
                <p className="text-sm text-gray-600">Je affiliate marketing command center</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowProfileModal(true)}
                className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                title="Profiel beheren"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="hidden sm:inline">Profiel</span>
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Uitloggen
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Actions */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
                <span>🚀</span>
                <span>Quick Actions</span>
              </h2>
              <p className="text-gray-600 mt-1">Alles wat je nodig hebt om te beginnen met verdienen</p>
            </div>
            <button
              onClick={() => setShowLinkGuide(!showLinkGuide)}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              ❓ Hoe werkt het?
            </button>
          </div>

          {/* Link Guide */}
          {showLinkGuide && (
            <div className="mb-6 p-6 bg-blue-50 rounded-xl border border-blue-200">
              <h3 className="text-lg font-semibold text-blue-900 mb-4">📚 Hoe gebruik je je affiliate link?</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-blue-800 mb-2">✅ Zo werkt het:</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Kopieer je unieke affiliate link hieronder</li>
                    <li>• Deel de link op social media, website, of email</li>
                    <li>• Klanten klikken op jouw link</li>
                    <li>• Bij elke aankoop krijg je <strong>{stats?.commission?.rate || 5}%</strong> commissie</li>
                    <li>• Commissies worden automatisch bijgehouden</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-blue-800 mb-2">💡 Pro Tips:</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Deel je link in verhalen en posts</li>
                    <li>• Voeg ?ref={influencer?.username} toe aan ELKE Filright link</li>
                    <li>• Gebruik verschillende platforms voor meer bereik</li>
                    <li>• Vertel waarom je Filright aanbeveelt</li>
                    <li>• Check regelmatig je dashboard voor resultaten</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Main Link Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">📋 Kopieer Referral Link</h3>
              {copyFeedback && (
                <span className="text-sm text-green-600 font-medium">{copyFeedback}</span>
              )}
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Jouw unieke affiliate link:
              </label>
              <div className="flex items-center space-x-3">
                <input
                  type="text"
                  value={getReferralLink()}
                  readOnly
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 font-mono text-sm"
                />
                <button
                  onClick={() => copyToClipboard(getReferralLink(), 'Link')}
                  className="px-4 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center space-x-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <span>Kopieer</span>
                </button>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <span className="text-amber-600 text-lg">💡</span>
                <div>
                  <p className="text-sm font-medium text-amber-800">Verdien meer:</p>
                  <p className="text-sm text-amber-700">
                    Voeg ?ref={influencer?.username} toe aan elke Filright link die je deelt!
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button
              onClick={shareToInstagram}
              className="p-4 bg-white border border-gray-200 rounded-xl hover:border-gray-300 hover:shadow-sm transition-all text-center group"
            >
              <div className="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:bg-pink-200 transition-colors">
                <span className="text-pink-600 text-xl">📸</span>
              </div>
              <p className="font-medium text-gray-900">Instagram Story</p>
            </button>

            <button
              onClick={shareToTikTok}
              className="p-4 bg-white border border-gray-200 rounded-xl hover:border-gray-300 hover:shadow-sm transition-all text-center group"
            >
              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:bg-gray-200 transition-colors">
                <span className="text-gray-700 text-xl">🎵</span>
              </div>
              <p className="font-medium text-gray-900">TikTok Bio</p>
            </button>

            <button
              onClick={shareToYouTube}
              className="p-4 bg-white border border-gray-200 rounded-xl hover:border-gray-300 hover:shadow-sm transition-all text-center group"
            >
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:bg-red-200 transition-colors">
                <span className="text-red-600 text-xl">📺</span>
              </div>
              <p className="font-medium text-gray-900">YouTube Desc</p>
            </button>

            <button
              onClick={shareViaEmail}
              className="p-4 bg-white border border-gray-200 rounded-xl hover:border-gray-300 hover:shadow-sm transition-all text-center group"
            >
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:bg-blue-200 transition-colors">
                <span className="text-blue-600 text-xl">📧</span>
              </div>
              <p className="font-medium text-gray-900">Email Share</p>
            </button>
          </div>
        </div>

        {/* Commission Overview */}
        {stats?.commission && (
          <div className="mb-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <div className="flex items-center space-x-3 mb-2">
                    <span className="text-2xl">💰</span>
                    <h2 className="text-2xl font-bold text-gray-900">Jouw Commissie Inkomsten</h2>
                  </div>
                  <p className="text-gray-600">Dit heb je verdiend met je affiliate marketing</p>
                </div>
                <div className="text-right">
                  <p className="text-4xl font-bold text-gray-900 mb-2">€{stats.commission.total.toFixed(2)}</p>
                  <p className="text-gray-600">
                    <span className="bg-gray-100 px-3 py-1 rounded-full text-sm font-medium">
                      {stats.commission.rate}% commissie
                    </span>
                  </p>
                  <p className="text-gray-500 text-sm mt-1">
                    Op €{stats.totalRevenue?.toFixed(2)} totale omzet
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-6">
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-gray-900">€{stats.commission.avgPerOrder.toFixed(2)}</p>
                  <p className="text-gray-600 text-sm">Gem. per order</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-gray-900">{stats.totalSales}</p>
                  <p className="text-gray-600 text-sm">Totale verkopen</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-gray-900">{stats.lastSale ? new Date(stats.lastSale).toLocaleDateString('nl-NL') : 'Geen'}</p>
                  <p className="text-gray-600 text-sm">Laatste verkoop</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Stats Grid */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <span className="text-green-600 text-xl">💰</span>
                </div>
                <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded-full font-medium">
                  +{stats.commission?.rate}%
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Totale Commissie</p>
                <p className="text-3xl font-bold text-gray-900 mb-1">
                  €{stats.commission?.total?.toFixed(2) || '0.00'}
                </p>
                <p className="text-xs text-gray-400">
                  Van €{stats.totalRevenue?.toFixed(2)} omzet
                </p>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <span className="text-blue-600 text-xl">📦</span>
                </div>
                <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full font-medium">
                  Orders
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Totale Verkopen</p>
                <p className="text-3xl font-bold text-gray-900 mb-1">{stats.totalSales}</p>
                <p className="text-xs text-gray-400">
                  Ø €{stats.commission?.avgPerOrder?.toFixed(2) || '0.00'} commissie/order
                </p>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                  <span className="text-gray-600 text-xl">💎</span>
                </div>
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full font-medium">
                  Revenue
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Totale Omzet</p>
                <p className="text-3xl font-bold text-gray-900 mb-1">
                  €{stats.totalRevenue?.toFixed(2)}
                </p>
                <p className="text-xs text-gray-400">
                  Ø €{stats.orderMetrics?.avgOrderValue?.toFixed(2) || '0.00'} per order
                </p>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                  <span className="text-indigo-600 text-xl">📈</span>
                </div>
                <span className="text-xs bg-indigo-100 text-indigo-600 px-2 py-1 rounded-full font-medium">
                  Growth
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Gemiddelde Order</p>
                <p className="text-3xl font-bold text-gray-900 mb-1">€{stats.orderMetrics?.avgOrderValue?.toFixed(2) || '0.00'}</p>
                <p className="text-xs text-gray-400">
                  Laatste verkoop: {stats.lastSale ? new Date(stats.lastSale).toLocaleDateString('nl-NL') : 'Geen'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Performance Insights */}
        {stats && (
          <div className="bg-white rounded-xl shadow-sm mb-8 border border-gray-200">
            <div className="px-8 py-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 flex items-center space-x-3">
                <span>📊</span>
                <span>Performance Insights</span>
              </h2>
              <p className="text-gray-600 mt-1">Inzichten om je verdiensten te maximaliseren</p>
            </div>
            <div className="p-8">
              <div className="grid md:grid-cols-3 gap-8">
                <div className="text-center p-6 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="w-16 h-16 bg-gray-900 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <span className="text-white text-2xl">🎯</span>
                  </div>
                  <p className="text-sm font-medium text-gray-600 mb-2">Jouw Commissie Rate</p>
                  <p className="text-4xl font-bold text-gray-900 mb-2">{stats.commission.rate}%</p>
                  <p className="text-xs text-gray-500">Van elke verkoop</p>
                  <div className="mt-4 p-3 bg-white rounded-lg border border-gray-200">
                    <p className="text-xs text-gray-600">
                      Bij €1000 omzet = <strong>€{(1000 * stats.commission.rate / 100).toFixed(0)}</strong> voor jou
                    </p>
                  </div>
                </div>

                <div className="text-center p-6 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="w-16 h-16 bg-gray-900 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <span className="text-white text-2xl">💳</span>
                  </div>
                  <p className="text-sm font-medium text-gray-600 mb-2">Gem. Commissie per Order</p>
                  <p className="text-4xl font-bold text-gray-900 mb-2">€{stats.commission.avgPerOrder.toFixed(2)}</p>
                  <p className="text-xs text-gray-500">Per verkoop</p>
                  <div className="mt-4 p-3 bg-white rounded-lg border border-gray-200">
                    <p className="text-xs text-gray-600">
                      Bij 10 orders/maand = <strong>€{(stats.commission.avgPerOrder * 10).toFixed(0)}</strong>
                    </p>
                  </div>
                </div>

                <div className="text-center p-6 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="w-16 h-16 bg-gray-900 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <span className="text-white text-2xl">🏆</span>
                  </div>
                  <p className="text-sm font-medium text-gray-600 mb-2">Totaal Verdiend</p>
                  <p className="text-4xl font-bold text-gray-900 mb-2">€{stats.commission.total.toFixed(2)}</p>
                  <p className="text-xs text-gray-500">Alle tijd</p>
                  <div className="mt-4 p-3 bg-white rounded-lg border border-gray-200">
                    <p className="text-xs text-gray-600">
                      Gebaseerd op <strong>{stats.totalSales}</strong> verkopen
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Recent Orders */}
        {stats?.recentOrders && (
          <div className="bg-white rounded-xl shadow-sm mb-8 border border-gray-200">
            <div className="px-8 py-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 flex items-center space-x-3">
                    <span>🛍️</span>
                    <span>Recente Bestellingen</span>
                  </h2>
                  <p className="text-gray-600 mt-1">Je laatste verkopen en verdiende commissies</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Totaal {stats.totalSales} orders</p>
                  <p className="text-lg font-bold text-gray-900">€{stats.commission.total.toFixed(2)} verdiend</p>
                </div>
              </div>
            </div>
            <div className="p-8">
              {stats.recentOrders.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-4 px-4 font-semibold text-gray-700">Datum</th>
                        <th className="text-left py-4 px-4 font-semibold text-gray-700">Order ID</th>
                        <th className="text-right py-4 px-4 font-semibold text-gray-700">Omzet</th>
                        <th className="text-right py-4 px-4 font-semibold text-gray-700">Jouw Commissie</th>
                        <th className="text-center py-4 px-4 font-semibold text-gray-700">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.recentOrders.map((order, index) => {
                        const orderCommission = (order.amount * (stats.commission?.rate || 5)) / 100;
                        return (
                          <tr key={index} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                            <td className="py-4 px-4 text-gray-900">
                              {new Date(order.date).toLocaleDateString('nl-NL')}
                            </td>
                            <td className="py-4 px-4">
                              <code className="text-sm bg-gray-100 px-2 py-1 rounded text-gray-700">
                                {order.orderId}
                              </code>
                            </td>
                            <td className="py-4 px-4 text-right font-semibold text-gray-900">
                              €{order.amount?.toFixed(2)}
                            </td>
                            <td className="py-4 px-4 text-right font-bold text-gray-900">
                              €{orderCommission?.toFixed(2)}
                            </td>
                            <td className="py-4 px-4 text-center">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                ✅ Bevestigd
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-gray-400 text-6xl mb-4">📦</div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Nog geen bestellingen</h3>
                  <p className="text-gray-600 mb-6">
                    Deel je affiliate link om je eerste verkoop te genereren!
                  </p>
                  <button
                    onClick={() => copyToClipboard(getReferralLink(), 'Link')}
                    className="px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
                  >
                    Kopieer je link
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Profile Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Profiel Beheren</h2>
                <button
                  onClick={() => setShowProfileModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Basic Info */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Basis Informatie</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Naam</label>
                    <input
                      type="text"
                      value={profile.name}
                      onChange={(e) => setProfile({...profile, name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Je volledige naam"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input
                      type="email"
                      value={profile.email}
                      onChange={(e) => setProfile({...profile, email: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="je@email.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Telefoon</label>
                    <input
                      type="tel"
                      value={profile.phone}
                      onChange={(e) => setProfile({...profile, phone: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="+31 6 12345678"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Website</label>
                    <input
                      type="url"
                      value={profile.website}
                      onChange={(e) => setProfile({...profile, website: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="https://jouwwebsite.com"
                    />
                  </div>
                </div>
              </div>

              {/* Social Media */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Social Media</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Instagram</label>
                    <input
                      type="text"
                      value={profile.instagram}
                      onChange={(e) => setProfile({...profile, instagram: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="@jouwusername"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">TikTok</label>
                    <input
                      type="text"
                      value={profile.tiktok}
                      onChange={(e) => setProfile({...profile, tiktok: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="@jouwusername"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">YouTube</label>
                    <input
                      type="text"
                      value={profile.youtube}
                      onChange={(e) => setProfile({...profile, youtube: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Kanaal naam"
                    />
                  </div>
                </div>
              </div>

              {/* Banking Info */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Bankgegevens</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">IBAN</label>
                    <input
                      type="text"
                      value={profile.bank_account}
                      onChange={(e) => setProfile({...profile, bank_account: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="NL00 BANK 0123 4567 89"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Bank Naam</label>
                    <input
                      type="text"
                      value={profile.bank_name}
                      onChange={(e) => setProfile({...profile, bank_name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="ING Bank"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Rekeninghouder</label>
                    <input
                      type="text"
                      value={profile.account_holder}
                      onChange={(e) => setProfile({...profile, account_holder: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Naam op de rekening"
                    />
                  </div>
                </div>
              </div>

              {/* Payment Preferences */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Uitbetaling Voorkeuren</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Uitbetaling Frequentie</label>
                  <select
                    value={profile.preferred_payment}
                    onChange={(e) => setProfile({...profile, preferred_payment: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="monthly">Maandelijks</option>
                    <option value="quarterly">Per kwartaal</option>
                    <option value="yearly">Jaarlijks</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end space-x-4">
              <button
                onClick={() => setShowProfileModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Annuleren
              </button>
              <button
                onClick={saveProfile}
                disabled={profileLoading}
                className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                {profileLoading ? 'Opslaan...' : 'Opslaan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard; 