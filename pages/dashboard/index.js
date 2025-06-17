import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

const Dashboard = () => {
  const [influencer, setInfluencer] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showProfile, setShowProfile] = useState(false);
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    bankAccount: '',
    bankName: '',
    accountHolder: '',
    socialMedia: {
      instagram: '',
      tiktok: '',
      youtube: '',
      website: ''
    },
    preferredPayment: 'bank',
    notes: ''
  });
  const [linkCopied, setLinkCopied] = useState(false);
  const [showLinkGuide, setShowLinkGuide] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check if user is logged in
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('influencer');
      if (!stored) {
        router.push('/dashboard/login');
        return;
      }

      const influencerData = JSON.parse(stored);
      setInfluencer(influencerData);
      
      // Load profile data
      loadProfile(influencerData.username);
      
      // Fetch stats
      fetchStats(influencerData.username);
    }
  }, [router]);

  const loadProfile = async (username) => {
    try {
      const response = await fetch(`/api/influencer/profile/${username}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setProfile({ ...profile, ...data.data });
        }
      }
    } catch (err) {
      console.log('Profile load error:', err);
    }
  };

  const fetchStats = async (username) => {
    try {
      const response = await fetch(`/api/dashboard/stats?influencer=${username}`);
      const data = await response.json();
      
      if (data.success) {
        setStats(data.data);
      } else {
        setError('Kon statistieken niet laden');
      }
    } catch (err) {
      setError('Er ging iets mis bij het laden van de data');
      console.error('Stats fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('influencer');
      router.push('/dashboard/login');
    }
  };

  const copyReferralLink = () => {
    const link = `https://filright.com?ref=${influencer.username}`;
    navigator.clipboard.writeText(link);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 3000);
  };

  const saveProfile = async () => {
    try {
      const response = await fetch(`/api/influencer/profile/${influencer.username}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile)
      });
      
      if (response.ok) {
        alert('Profiel succesvol opgeslagen!');
        setShowProfile(false);
      } else {
        alert('Er ging iets mis bij het opslaan');
      }
    } catch (err) {
      alert('Er ging iets mis bij het opslaan');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-200 border-t-indigo-600 mx-auto"></div>
          <p className="mt-6 text-gray-600 text-lg">Dashboard laden...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-2xl shadow-xl">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-red-600 text-2xl">⚠️</span>
          </div>
          <p className="text-red-600 text-lg mb-4">{error}</p>
          <button 
            onClick={() => router.push('/dashboard/login')}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Terug naar login
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Dashboard - {influencer?.name}</title>
        <meta name="description" content="Filright influencer dashboard - Beheer je affiliate marketing" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        {/* Header */}
        <header className="bg-white shadow-lg border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <span className="text-white text-xl font-bold">
                    {influencer?.name?.charAt(0)?.toUpperCase() || 'F'}
                  </span>
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                    Welkom, {influencer?.name}! 👋
                  </h1>
                  <p className="text-gray-600">Je affiliate marketing command center</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setShowProfile(true)}
                  className="px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors flex items-center space-x-2"
                >
                  <span>⚙️</span>
                  <span>Profiel</span>
                </button>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Uitloggen
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          {/* Enhanced Quick Actions */}
          <div className="mb-8">
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">🚀 Quick Actions</h2>
                  <p className="text-gray-600">Alles wat je nodig hebt om te beginnen met verdienen</p>
                </div>
                <button
                  onClick={() => setShowLinkGuide(!showLinkGuide)}
                  className="px-4 py-2 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  {showLinkGuide ? '📖 Verberg uitleg' : '❓ Hoe werkt het?'}
                </button>
              </div>

              {/* Link Guide */}
              {showLinkGuide && (
                <div className="mb-6 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
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

              {/* Action Buttons */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={copyReferralLink}
                      className={`flex-1 px-6 py-4 rounded-xl font-semibold transition-all duration-200 ${
                        linkCopied 
                          ? 'bg-green-500 text-white' 
                          : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 transform hover:scale-105'
                      }`}
                    >
                      {linkCopied ? '✅ Link gekopieerd!' : '📋 Kopieer Referral Link'}
                    </button>
                  </div>
                  
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-sm font-medium text-gray-700 mb-2">Jouw unieke affiliate link:</p>
                    <div className="flex items-center space-x-2">
                      <code className="flex-1 text-sm bg-white px-3 py-2 rounded-lg border font-mono text-indigo-600">
                        https://filright.com?ref={influencer?.username}
                      </code>
                      <button
                        onClick={copyReferralLink}
                        className="px-3 py-2 text-gray-600 hover:text-indigo-600 transition-colors"
                        title="Kopieer link"
                      >
                        📋
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <button className="px-4 py-3 bg-pink-500 text-white rounded-xl hover:bg-pink-600 transition-colors text-sm font-medium">
                      📱 Instagram Story
                    </button>
                    <button className="px-4 py-3 bg-black text-white rounded-xl hover:bg-gray-800 transition-colors text-sm font-medium">
                      🎵 TikTok Bio
                    </button>
                    <button className="px-4 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors text-sm font-medium">
                      📺 YouTube Desc
                    </button>
                    <button className="px-4 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors text-sm font-medium">
                      💌 Email Share
                    </button>
                  </div>
                  
                  <div className="p-4 bg-yellow-50 rounded-xl border border-yellow-200">
                    <p className="text-sm text-yellow-800">
                      <strong>💰 Verdien meer:</strong> Voeg ?ref={influencer?.username} toe aan elke Filright link die je deelt!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Commission Highlight */}
          {stats?.commission && (
            <div className="mb-8">
              <div className="bg-gradient-to-r from-green-500 via-green-600 to-emerald-600 rounded-2xl shadow-2xl p-8 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-16 -mt-16"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-white opacity-10 rounded-full -ml-12 -mb-12"></div>
                <div className="relative">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="text-3xl">💰</span>
                        <h2 className="text-3xl font-bold">Jouw Commissie Inkomsten</h2>
                      </div>
                      <p className="text-green-100 text-lg">Dit heb je verdiend met je affiliate marketing</p>
                    </div>
                    <div className="text-right">
                      <p className="text-5xl font-bold mb-2">€{stats.commission.total.toFixed(2)}</p>
                      <p className="text-green-100 text-lg">
                        <span className="bg-white bg-opacity-20 px-3 py-1 rounded-full">
                          {stats.commission.rate}% commissie
                        </span>
                      </p>
                      <p className="text-green-100 mt-1">
                        Op €{stats.totalRevenue?.toFixed(2)} totale omzet
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-6 grid grid-cols-3 gap-4">
                    <div className="bg-white bg-opacity-20 rounded-xl p-4 text-center">
                      <p className="text-2xl font-bold">€{stats.commission.avgPerOrder.toFixed(2)}</p>
                      <p className="text-green-100 text-sm">Gem. per order</p>
                    </div>
                    <div className="bg-white bg-opacity-20 rounded-xl p-4 text-center">
                      <p className="text-2xl font-bold">{stats.totalSales}</p>
                      <p className="text-green-100 text-sm">Totale verkopen</p>
                    </div>
                    <div className="bg-white bg-opacity-20 rounded-xl p-4 text-center">
                      <p className="text-2xl font-bold">{stats.conversionRate}%</p>
                      <p className="text-green-100 text-sm">Conversie rate</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Enhanced Stats Grid */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-green-600 rounded-xl flex items-center justify-center">
                    <span className="text-white text-xl">💰</span>
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

              <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-blue-600 rounded-xl flex items-center justify-center">
                    <span className="text-white text-xl">📦</span>
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

              <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-purple-600 rounded-xl flex items-center justify-center">
                    <span className="text-white text-xl">💎</span>
                  </div>
                  <span className="text-xs bg-purple-100 text-purple-600 px-2 py-1 rounded-full font-medium">
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

              <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-orange-400 to-orange-600 rounded-xl flex items-center justify-center">
                    <span className="text-white text-xl">📈</span>
                  </div>
                  <span className="text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded-full font-medium">
                    Performance
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Conversie Rate</p>
                  <p className="text-3xl font-bold text-gray-900 mb-1">{stats.conversionRate}%</p>
                  <p className="text-xs text-gray-400">
                    Laatste verkoop: {stats.lastSale || 'Geen'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Performance Insights */}
          {stats && (
            <div className="bg-white rounded-2xl shadow-xl mb-8 border border-gray-100">
              <div className="px-8 py-6 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center space-x-3">
                  <span>📊</span>
                  <span>Performance Insights</span>
                </h2>
                <p className="text-gray-600 mt-1">Inzichten om je verdiensten te maximaliseren</p>
              </div>
              <div className="p-8">
                <div className="grid md:grid-cols-3 gap-8">
                  <div className="text-center p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border border-green-200">
                    <div className="w-16 h-16 bg-green-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <span className="text-white text-2xl">🎯</span>
                    </div>
                    <p className="text-sm font-medium text-gray-600 mb-2">Jouw Commissie Rate</p>
                    <p className="text-4xl font-bold text-green-600 mb-2">{stats.commission.rate}%</p>
                    <p className="text-xs text-gray-500">Van elke verkoop</p>
                    <div className="mt-4 p-3 bg-white rounded-lg">
                      <p className="text-xs text-gray-600">
                        Bij €1000 omzet = <strong>€{(1000 * stats.commission.rate / 100).toFixed(0)}</strong> voor jou
                      </p>
                    </div>
                  </div>

                  <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-200">
                    <div className="w-16 h-16 bg-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <span className="text-white text-2xl">💳</span>
                    </div>
                    <p className="text-sm font-medium text-gray-600 mb-2">Gem. Commissie per Order</p>
                    <p className="text-4xl font-bold text-blue-600 mb-2">€{stats.commission.avgPerOrder.toFixed(2)}</p>
                    <p className="text-xs text-gray-500">Per verkoop</p>
                    <div className="mt-4 p-3 bg-white rounded-lg">
                      <p className="text-xs text-gray-600">
                        Bij 10 orders/maand = <strong>€{(stats.commission.avgPerOrder * 10).toFixed(0)}</strong>
                      </p>
                    </div>
                  </div>

                  <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl border border-purple-200">
                    <div className="w-16 h-16 bg-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <span className="text-white text-2xl">🏆</span>
                    </div>
                    <p className="text-sm font-medium text-gray-600 mb-2">Totaal Verdiend</p>
                    <p className="text-4xl font-bold text-purple-600 mb-2">€{stats.commission.total.toFixed(2)}</p>
                    <p className="text-xs text-gray-500">Alle tijd</p>
                    <div className="mt-4 p-3 bg-white rounded-lg">
                      <p className="text-xs text-gray-600">
                        Gebaseerd op <strong>{stats.totalSales}</strong> verkopen
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-8 p-6 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl border border-indigo-200">
                  <h3 className="text-lg font-bold text-indigo-900 mb-4 flex items-center space-x-2">
                    <span>💡</span>
                    <span>Tips om meer te verdienen</span>
                  </h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold text-indigo-800 mb-2">🚀 Verhoog je bereik:</h4>
                      <ul className="text-sm text-indigo-700 space-y-1">
                        <li>• Deel je link op meerdere platforms</li>
                        <li>• Gebruik verhalen én posts</li>
                        <li>• Maak content over Filright producten</li>
                        <li>• Voeg je link toe aan je bio</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold text-indigo-800 mb-2">💰 Optimaliseer conversie:</h4>
                      <ul className="text-sm text-indigo-700 space-y-1">
                        <li>• Vertel je persoonlijke ervaring</li>
                        <li>• Gebruik high-quality product foto's</li>
                        <li>• Deel tijdens peak uren</li>
                        <li>• Reageer op vragen van followers</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Enhanced Recent Orders */}
          {stats?.recentOrders && (
            <div className="bg-white rounded-2xl shadow-xl mb-8 border border-gray-100">
              <div className="px-8 py-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 flex items-center space-x-3">
                      <span>🛍️</span>
                      <span>Recente Bestellingen</span>
                    </h2>
                    <p className="text-gray-600 mt-1">Je laatste verkopen en verdiende commissies</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Totaal {stats.totalSales} orders</p>
                    <p className="text-lg font-bold text-green-600">€{stats.commission.total.toFixed(2)} verdiend</p>
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
                                <code className="text-sm bg-gray-100 px-2 py-1 rounded text-indigo-600">
                                  {order.orderId}
                                </code>
                              </td>
                              <td className="py-4 px-4 text-right font-semibold text-gray-900">
                                €{order.amount?.toFixed(2)}
                              </td>
                              <td className="py-4 px-4 text-right font-bold text-green-600">
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
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-gray-400 text-3xl">🛍️</span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Nog geen bestellingen</h3>
                    <p className="text-gray-500 mb-6">Deel je affiliate link om te beginnen met verdienen!</p>
                    <button
                      onClick={copyReferralLink}
                      className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                      📋 Kopieer je link nu
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="text-center text-gray-500 text-sm py-8">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <span>🏆</span>
              <span className="font-semibold">Filright Affiliate Dashboard</span>
            </div>
            <p>Data wordt realtime bijgewerkt • Commissies maandelijks uitbetaald</p>
            <p className="mt-2 text-xs">
              Vragen? Neem contact op via support@filright.com
            </p>
          </div>
        </main>

        {/* Profile Modal */}
        {showProfile && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="px-8 py-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900 flex items-center space-x-3">
                    <span>⚙️</span>
                    <span>Profiel & Uitbetaling</span>
                  </h2>
                  <button
                    onClick={() => setShowProfile(false)}
                    className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
                  >
                    ✕
                  </button>
                </div>
                <p className="text-gray-600 mt-1">Beheer je persoonlijke gegevens en uitbetalingsinstellingen</p>
              </div>

              <div className="p-8 space-y-8">
                {/* Personal Info */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                    <span>👤</span>
                    <span>Persoonlijke Gegevens</span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Volledige Naam</label>
                      <input
                        type="text"
                        value={profile.name}
                        onChange={(e) => setProfile({...profile, name: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                        placeholder="Je volledige naam"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email Adres</label>
                      <input
                        type="email"
                        value={profile.email}
                        onChange={(e) => setProfile({...profile, email: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                        placeholder="je@email.com"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Telefoonnummer</label>
                      <input
                        type="tel"
                        value={profile.phone}
                        onChange={(e) => setProfile({...profile, phone: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                        placeholder="+31 6 12345678"
                      />
                    </div>
                  </div>
                </div>

                {/* Bank Details */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                    <span>🏦</span>
                    <span>Uitbetalingsgegevens</span>
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Rekeninghouder</label>
                      <input
                        type="text"
                        value={profile.accountHolder}
                        onChange={(e) => setProfile({...profile, accountHolder: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                        placeholder="Naam op bankrekening"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">IBAN Rekeningnummer</label>
                        <input
                          type="text"
                          value={profile.bankAccount}
                          onChange={(e) => setProfile({...profile, bankAccount: e.target.value})}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors font-mono"
                          placeholder="NL12 BANK 0123 4567 89"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Bank Naam</label>
                        <input
                          type="text"
                          value={profile.bankName}
                          onChange={(e) => setProfile({...profile, bankName: e.target.value})}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                          placeholder="bijv. ING, ABN AMRO"
                        />
                      </div>
                    </div>
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-sm text-blue-800">
                        <strong>💡 Uitbetaling:</strong> Commissies worden maandelijks uitbetaald op je opgegeven bankrekening. 
                        Minimum uitbetaling is €25.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Social Media */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                    <span>📱</span>
                    <span>Social Media (Optioneel)</span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Instagram</label>
                      <input
                        type="text"
                        value={profile.socialMedia.instagram}
                        onChange={(e) => setProfile({...profile, socialMedia: {...profile.socialMedia, instagram: e.target.value}})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                        placeholder="@jouwusername"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">TikTok</label>
                      <input
                        type="text"
                        value={profile.socialMedia.tiktok}
                        onChange={(e) => setProfile({...profile, socialMedia: {...profile.socialMedia, tiktok: e.target.value}})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                        placeholder="@jouwusername"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">YouTube</label>
                      <input
                        type="text"
                        value={profile.socialMedia.youtube}
                        onChange={(e) => setProfile({...profile, socialMedia: {...profile.socialMedia, youtube: e.target.value}})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                        placeholder="Kanaal naam"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Website</label>
                      <input
                        type="url"
                        value={profile.socialMedia.website}
                        onChange={(e) => setProfile({...profile, socialMedia: {...profile.socialMedia, website: e.target.value}})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                        placeholder="https://jouwwebsite.com"
                      />
                    </div>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Opmerkingen (Optioneel)</label>
                  <textarea
                    value={profile.notes}
                    onChange={(e) => setProfile({...profile, notes: e.target.value})}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                    placeholder="Eventuele opmerkingen of speciale verzoeken..."
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                  <button
                    onClick={() => setShowProfile(false)}
                    className="px-6 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Annuleren
                  </button>
                  <button
                    onClick={saveProfile}
                    className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all"
                  >
                    💾 Profiel Opslaan
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Dashboard; 