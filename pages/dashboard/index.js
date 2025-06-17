import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

const Dashboard = () => {
  const [influencer, setInfluencer] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    // Check if user is logged in
    const stored = localStorage.getItem('influencer');
    if (!stored) {
      router.push('/dashboard/login');
      return;
    }

    const influencerData = JSON.parse(stored);
    setInfluencer(influencerData);
    
    // Fetch stats
    fetchStats(influencerData.username);
  }, [router]);

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
    localStorage.removeItem('influencer');
    router.push('/dashboard/login');
  };

  const copyReferralLink = () => {
    const link = `https://filright.com?ref=${influencer.username}`;
    navigator.clipboard.writeText(link);
    // Show copied feedback (optional)
    alert('Link gekopieerd naar klembord!');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Dashboard laden...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 text-lg">{error}</p>
          <button 
            onClick={() => router.push('/dashboard/login')}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
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
        <meta name="description" content="Filright influencer dashboard" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Welkom, {influencer?.name}!
                </h1>
                <p className="text-gray-600">Je affiliate marketing dashboard</p>
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              >
                Uitloggen
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          {/* Quick Actions */}
          <div className="mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
              <div className="flex space-x-4">
                <button
                  onClick={copyReferralLink}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                >
                  📋 Kopieer Referral Link
                </button>
                <div className="text-sm text-gray-600 flex items-center">
                  <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                    filright.com?ref={influencer?.username}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Commission Highlight */}
          {stats?.commission && (
            <div className="mb-8">
              <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg shadow-lg p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">Jouw Commissie</h2>
                    <p className="text-green-100">Dit heb je verdiend met je affiliate links</p>
                  </div>
                  <div className="text-right">
                    <p className="text-4xl font-bold">€{stats.commission.total.toFixed(2)}</p>
                    <p className="text-green-100">
                      {stats.commission.rate}% commissie op €{stats.totalRevenue?.toFixed(2)} omzet
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-100 rounded-md flex items-center justify-center">
                      <span className="text-green-600 text-sm font-bold">💰</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Totale Commissie</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      €{stats.commission?.total?.toFixed(2) || '0.00'}
                    </p>
                    <p className="text-xs text-gray-400">
                      {stats.commission?.rate || 5}% van omzet
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-100 rounded-md flex items-center justify-center">
                      <span className="text-blue-600 text-sm font-bold">#</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Totale Verkopen</p>
                    <p className="text-2xl font-semibold text-gray-900">{stats.totalSales}</p>
                    <p className="text-xs text-gray-400">
                      Ø €{stats.commission?.avgPerOrder?.toFixed(2) || '0.00'} per order
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-purple-100 rounded-md flex items-center justify-center">
                      <span className="text-purple-600 text-sm font-bold">€</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Totale Omzet</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      €{stats.totalRevenue?.toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-400">
                      Ø €{stats.orderMetrics?.avgOrderValue?.toFixed(2) || '0.00'} per order
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-orange-100 rounded-md flex items-center justify-center">
                      <span className="text-orange-600 text-sm font-bold">📅</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Laatste Verkoop</p>
                    <p className="text-2xl font-semibold text-gray-900">{stats.lastSale || 'Geen'}</p>
                    <p className="text-xs text-gray-400">
                      {stats.conversionRate}% conversie rate
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Commission Details */}
          {stats?.commission && (
            <div className="bg-white rounded-lg shadow mb-8">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Commissie Details</h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <p className="text-sm font-medium text-gray-500">Jouw Commissie Percentage</p>
                    <p className="text-3xl font-bold text-green-600">{stats.commission.rate}%</p>
                    <p className="text-xs text-gray-400 mt-1">Van elke verkoop</p>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm font-medium text-gray-500">Gemiddelde Commissie per Order</p>
                    <p className="text-3xl font-bold text-blue-600">€{stats.commission.avgPerOrder.toFixed(2)}</p>
                    <p className="text-xs text-gray-400 mt-1">Per verkoop</p>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <p className="text-sm font-medium text-gray-500">Totaal Verdiend</p>
                    <p className="text-3xl font-bold text-purple-600">€{stats.commission.total.toFixed(2)}</p>
                    <p className="text-xs text-gray-400 mt-1">Alle tijd</p>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">💡 Hoe werkt het?</h3>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Je krijgt <strong>{stats.commission.rate}%</strong> commissie op elke verkoop via jouw link</li>
                    <li>• Bij een verkoop van €100 verdien je €{(100 * stats.commission.rate / 100).toFixed(2)}</li>
                    <li>• Je gemiddelde order waarde is €{stats.orderMetrics?.avgOrderValue?.toFixed(2)}</li>
                    <li>• Commissies worden maandelijks uitbetaald</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Recent Orders */}
          {stats?.recentOrders && (
            <div className="bg-white rounded-lg shadow mb-8">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Recente Bestellingen</h2>
                <p className="text-sm text-gray-500">Je laatste verkopen en verdiende commissies</p>
              </div>
              <div className="p-6">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Datum
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Order ID
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Omzet
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Jouw Commissie
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {stats.recentOrders.map((order, index) => {
                        const orderCommission = (order.amount * (stats.commission?.rate || 5)) / 100;
                        return (
                          <tr key={index}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {order.date}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                              {order.orderId}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              €{order.amount?.toFixed(2)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-600">
                              €{orderCommission?.toFixed(2)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                
                {stats.recentOrders.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-gray-500">Nog geen bestellingen via jouw affiliate link</p>
                    <p className="text-sm text-gray-400 mt-1">Deel je link om te beginnen met verdienen!</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="text-center text-gray-500 text-sm">
            <p>© 2025 Filright Affiliate Dashboard</p>
            <p className="mt-1">Data wordt realtime bijgewerkt uit je affiliate verkopen</p>
          </div>
        </main>
      </div>
    </>
  );
};

export default Dashboard; 