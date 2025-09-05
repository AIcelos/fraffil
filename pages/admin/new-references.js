import { useState, useEffect } from 'react';
import Head from 'next/head';

export default function NewReferences() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRefs, setSelectedRefs] = useState(new Set());
  const [registering, setRegistering] = useState(false);

  useEffect(() => {
    fetchNewReferences();
  }, []);

  const fetchNewReferences = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/new-references');
      const result = await response.json();
      
      if (result.success) {
        setData(result.data);
      } else {
        setError(result.error || 'Failed to fetch data');
      }
    } catch (err) {
      setError('Network error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRefSelect = (ref) => {
    const newSelected = new Set(selectedRefs);
    if (newSelected.has(ref)) {
      newSelected.delete(ref);
    } else {
      newSelected.add(ref);
    }
    setSelectedRefs(newSelected);
  };

  const handleBulkRegister = async () => {
    if (selectedRefs.size === 0) return;
    
    setRegistering(true);
    try {
      // For now, just show alert - we'll implement the actual registration later
      alert(`Would register ${selectedRefs.size} influencers: ${Array.from(selectedRefs).join(', ')}`);
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setRegistering(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('nl-NL');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Laden...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">❌ Error</div>
          <p className="text-gray-600">{error}</p>
          <button 
            onClick={fetchNewReferences}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Opnieuw proberen
          </button>
        </div>
      </div>
    );
  }

  const { newReferences, registeredInfluencers, summary } = data;

  return (
    <div className="min-h-screen bg-gray-100">
      <Head>
        <title>Nieuwe Referenties - FilRight Admin</title>
      </Head>

      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Nieuwe Referenties</h1>
                <p className="mt-2 text-gray-600">
                  Referenties uit Google Sheets die nog niet als influencer zijn geregistreerd
                </p>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={fetchNewReferences}
                  className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                >
                  🔄 Ververs
                </button>
                {selectedRefs.size > 0 && (
                  <button
                    onClick={handleBulkRegister}
                    disabled={registering}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                  >
                    {registering ? 'Registreren...' : `📝 Registreer ${selectedRefs.size} geselecteerd`}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="text-2xl font-bold text-blue-600">{summary.totalReferencesInSheets}</div>
              <div className="ml-3 text-sm text-gray-600">Totaal in Sheets</div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="text-2xl font-bold text-green-600">{summary.registeredInfluencers}</div>
              <div className="ml-3 text-sm text-gray-600">Geregistreerd</div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="text-2xl font-bold text-orange-600">{summary.newReferences}</div>
              <div className="ml-3 text-sm text-gray-600">Nieuwe Referenties</div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="text-2xl font-bold text-purple-600">{formatCurrency(summary.totalNewRevenue)}</div>
              <div className="ml-3 text-sm text-gray-600">Nieuwe Omzet</div>
            </div>
          </div>
        </div>

        {/* New References Table */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Nieuwe Referenties ({newReferences.length})
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Selecteer referenties om ze als influencer te registreren
            </p>
          </div>

          {newReferences.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <div className="text-gray-400 text-4xl mb-4">🎉</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Geen nieuwe referenties</h3>
              <p className="text-gray-500">Alle referenties uit Google Sheets zijn al geregistreerd als influencers.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedRefs.size === newReferences.length && newReferences.length > 0}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedRefs(new Set(newReferences.map(ref => ref.ref)));
                          } else {
                            setSelectedRefs(new Set());
                          }
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Referentie
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sales
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Omzet
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Eerste Sale
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Laatste Sale
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acties
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {newReferences.map((ref, index) => (
                    <tr key={ref.ref} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedRefs.has(ref.ref)}
                          onChange={() => handleRefSelect(ref.ref)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{ref.ref}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{ref.totalSales}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{formatCurrency(ref.totalRevenue)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{formatDate(ref.firstSale)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{formatDate(ref.lastSale)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => {
                            // Single registration - for now just show alert
                            alert(`Would register: ${ref.ref}`);
                          }}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          📝 Registreer
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recent Orders Preview */}
        {newReferences.length > 0 && (
          <div className="mt-8 bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Recente Orders Preview</h3>
              <p className="mt-1 text-sm text-gray-500">
                Eerste 3 orders van elke nieuwe referentie
              </p>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {newReferences.slice(0, 6).map((ref) => (
                  <div key={ref.ref} className="border rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-3">{ref.ref}</h4>
                    <div className="space-y-2">
                      {ref.orders.slice(0, 3).map((order, idx) => (
                        <div key={idx} className="text-sm text-gray-600 flex justify-between">
                          <span>{order.orderId}</span>
                          <span className="font-medium">{formatCurrency(order.amount)}</span>
                        </div>
                      ))}
                      {ref.orders.length > 3 && (
                        <div className="text-xs text-gray-400">
                          +{ref.orders.length - 3} meer...
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
