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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-xl">F</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Welkom terug, {influencer?.name || influencer?.username}!
                </h1>
                <p className="text-gray-600">Jouw affiliate dashboard</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowProfileModal(true)}
                className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
              >
                <span className="flex items-center space-x-2">
                  <span>👤</span>
                  <span>Profiel</span>
                </span>
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Uitloggen
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Actions Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border border-gray-100">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-blue-500 rounded-lg flex items-center justify-center">
              <span className="text-white text-lg">🚀</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Quick Actions</h2>
            <span className="text-sm text-gray-500">Alles wat je nodig hebt om te beginnen met verdienen</span>
          </div>

          {/* Referral Link Section */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 mb-6 border border-blue-100">
            <div className="flex items-center space-x-3 mb-4">
              <span className="text-2xl">🔗</span>
              <h3 className="text-lg font-semibold text-gray-900">Kopieer Referral Link</h3>
            </div>
            <p className="text-gray-600 mb-4">Jouw unieke affiliate link:</p>
            <div className="flex items-center space-x-3">
              <input
                type="text"
                value={getReferralLink()}
                readOnly
                className="flex-1 px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-700 font-mono text-sm"
              />
              <button
                onClick={() => copyToClipboard(getReferralLink(), 'Link')}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 font-medium"
              >
                📋 Kopieer
              </button>
            </div>
            {copyFeedback && (
              <div className="mt-3 p-3 bg-green-100 border border-green-200 rounded-lg">
                <p className="text-green-700 font-medium">✅ {copyFeedback}</p>
              </div>
            )}
            <div className="mt-4 p-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg">
              <p className="text-amber-800 font-medium">
                💡 <strong>Tip:</strong> Voeg ?ref={influencer?.username} toe aan elke Filright link die je deelt!
              </p>
            </div>
          </div>

          {/* Share Buttons */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button
              onClick={shareToInstagram}
              className="p-4 bg-gradient-to-br from-pink-500 to-purple-600 text-white rounded-xl hover:from-pink-600 hover:to-purple-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
            >
              <div className="text-center">
                <div className="text-2xl mb-2">📸</div>
                <div className="font-medium">Instagram Story</div>
              </div>
            </button>
            <button
              onClick={shareToTikTok}
              className="p-4 bg-gradient-to-br from-gray-800 to-gray-900 text-white rounded-xl hover:from-gray-900 hover:to-black transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
            >
              <div className="text-center">
                <div className="text-2xl mb-2">🎵</div>
                <div className="font-medium">TikTok Bio</div>
              </div>
            </button>
            <button
              onClick={shareToYouTube}
              className="p-4 bg-gradient-to-br from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
            >
              <div className="text-center">
                <div className="text-2xl mb-2">📺</div>
                <div className="font-medium">YouTube Desc</div>
              </div>
            </button>
            <button
              onClick={shareViaEmail}
              className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
            >
              <div className="text-center">
                <div className="text-2xl mb-2">📧</div>
                <div className="font-medium">Email Share</div>
              </div>
            </button>
          </div>
        </div>

        {/* Commission Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border border-gray-100 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full -mr-16 -mt-16 opacity-10"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-emerald-500 rounded-xl flex items-center justify-center">
                  <span className="text-white text-2xl">💰</span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Jouw Commissie Inkomsten</h2>
                  <p className="text-gray-600">Dit heb je verdiend met je affiliate marketing</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-4xl font-bold bg-gradient-to-r from-green-500 to-emerald-600 bg-clip-text text-transparent">
                  €{stats?.commission?.total?.toFixed(2) || '0.00'}
                </div>
                <div className="text-sm text-gray-500">
                  {stats?.commission?.rate || 0}% commissie
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  Op €{stats?.totalRevenue?.toFixed(2) || '0.00'} totale omzet
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-100">
                <div className="flex items-center space-x-3 mb-2">
                  <span className="text-2xl">📊</span>
                  <span className="text-sm font-medium text-gray-600">Gem. per order</span>
                </div>
                <div className="text-2xl font-bold text-blue-600">
                  €{(stats?.avgOrderValue || 0).toFixed(2)}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  ≈ €{(stats?.commission?.avgPerOrder || 0).toFixed(2)} commissie
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-xl border border-purple-100">
                <div className="flex items-center space-x-3 mb-2">
                  <span className="text-2xl">🛍️</span>
                  <span className="text-sm font-medium text-gray-600">Totale verkopen</span>
                </div>
                <div className="text-2xl font-bold text-purple-600">
                  {stats?.totalSales || 0}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Laatste verkoop: {stats?.lastSale ? new Date(stats.lastSale).toLocaleDateString('nl-NL') : 'Nog geen verkopen'}
                </div>
              </div>

              <div className="bg-gradient-to-br from-emerald-50 to-green-50 p-6 rounded-xl border border-emerald-100">
                <div className="flex items-center space-x-3 mb-2">
                  <span className="text-2xl">💎</span>
                  <span className="text-sm font-medium text-gray-600">Totale Omzet</span>
                </div>
                <div className="text-2xl font-bold text-emerald-600">
                  €{(stats?.totalRevenue || 0).toFixed(2)}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  ≈ €{((stats?.totalRevenue || 0) * (stats?.commission?.rate || 0) / 100).toFixed(2)} commissie
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Performance Insights */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-8 h-8 bg-gradient-to-r from-indigo-400 to-purple-500 rounded-lg flex items-center justify-center">
              <span className="text-white text-lg">📈</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Performance Insights</h2>
            <span className="text-sm text-gray-500">Inzichten om je verdiensten te maximaliseren</span>
          </div>

          {stats?.recentOrders && stats.recentOrders.length > 0 ? (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Recente Verkopen</h3>
              <div className="space-y-3">
                {stats.recentOrders.slice(0, 5).map((order, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border border-gray-100">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">Order #{order.orderId}</div>
                        <div className="text-sm text-gray-600">
                          {new Date(order.date).toLocaleDateString('nl-NL', { 
                            day: 'numeric', 
                            month: 'long', 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-lg text-gray-900">€{order.amount.toFixed(2)}</div>
                      <div className="text-sm text-green-600 font-medium">
                        +€{(order.amount * (stats?.commission?.rate || 0) / 100).toFixed(2)} commissie
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🎯</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Nog geen verkopen</h3>
              <p className="text-gray-600 mb-6">Begin met het delen van je referral link om je eerste commissie te verdienen!</p>
              <button
                onClick={() => copyToClipboard(getReferralLink(), 'Link')}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 font-medium"
              >
                📋 Kopieer je link en begin!
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Profile Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Profiel Bewerken</h2>
                <button
                  onClick={() => setShowProfileModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Naam</label>
                    <input
                      type="text"
                      value={profile.name}
                      onChange={(e) => setProfile({...profile, name: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Je volledige naam"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input
                      type="email"
                      value={profile.email}
                      onChange={(e) => setProfile({...profile, email: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="je@email.com"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Telefoon</label>
                    <input
                      type="tel"
                      value={profile.phone}
                      onChange={(e) => setProfile({...profile, phone: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="+31 6 12345678"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Instagram</label>
                    <input
                      type="text"
                      value={profile.instagram}
                      onChange={(e) => setProfile({...profile, instagram: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="@jouwinstagram"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">TikTok</label>
                    <input
                      type="text"
                      value={profile.tiktok}
                      onChange={(e) => setProfile({...profile, tiktok: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="@jouwtiktok"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">YouTube</label>
                    <input
                      type="text"
                      value={profile.youtube}
                      onChange={(e) => setProfile({...profile, youtube: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Jouw YouTube kanaal"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Bank Account (IBAN)</label>
                  <input
                    type="text"
                    value={profile.bank_account}
                    onChange={(e) => setProfile({...profile, bank_account: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="NL00 BANK 0000 0000 00"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Bank Naam</label>
                    <input
                      type="text"
                      value={profile.bank_name}
                      onChange={(e) => setProfile({...profile, bank_name: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="ING, ABN AMRO, etc."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Rekeninghouder</label>
                    <input
                      type="text"
                      value={profile.account_holder}
                      onChange={(e) => setProfile({...profile, account_holder: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Naam op de bankrekening"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Uitbetaling Voorkeur</label>
                  <select
                    value={profile.preferred_payment}
                    onChange={(e) => setProfile({...profile, preferred_payment: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="monthly">Maandelijks</option>
                    <option value="quarterly">Per kwartaal</option>
                    <option value="on_request">Op aanvraag</option>
                  </select>
                </div>

                <div className="flex space-x-4 pt-6">
                  <button
                    onClick={saveProfile}
                    disabled={profileLoading}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 font-medium disabled:opacity-50"
                  >
                    {profileLoading ? 'Opslaan...' : 'Profiel Opslaan'}
                  </button>
                  <button
                    onClick={() => setShowProfileModal(false)}
                    className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Annuleren
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard; 