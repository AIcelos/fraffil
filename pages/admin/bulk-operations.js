import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

export default function BulkOperations() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('export');
  
  // CSV Import/Export state
  const [csvData, setCsvData] = useState('');
  const [importResults, setImportResults] = useState(null);
  const [exportLoading, setExportLoading] = useState(false);
  
  // Bulk Updates state
  const [selectedInfluencers, setSelectedInfluencers] = useState([]);
  const [allInfluencers, setAllInfluencers] = useState([]);
  const [bulkCommission, setBulkCommission] = useState('');
  const [bulkStatus, setBulkStatus] = useState('active');
  const [bulkResults, setBulkResults] = useState(null);
  const [bulkLoading, setBulkLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    const user = localStorage.getItem('adminUser');
    
    if (token && user) {
      setIsAuthenticated(true);
      loadInfluencers();
    } else {
      router.push('/admin/login');
    }
    setIsLoading(false);
  }, []);

  const loadInfluencers = async () => {
    try {
      const response = await fetch('/api/admin/users-db', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setAllInfluencers(data.users || []);
        }
      }
    } catch (error) {
      console.error('Error loading influencers:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    router.push('/admin/login');
  };

  const handleExportCSV = async () => {
    setExportLoading(true);
    try {
      const response = await fetch('/api/admin/bulk-operations', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Create downloadable CSV file
          const blob = new Blob([data.data], { type: 'text/csv' });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `influencers-export-${new Date().toISOString().split('T')[0]}.csv`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
          
          console.log(`✅ CSV Export: ${data.count} influencers exported`);
        }
      }
    } catch (error) {
      console.error('Export error:', error);
    }
    setExportLoading(false);
  };

  const handleImportCSV = async () => {
    if (!csvData.trim()) {
      alert('Plak eerst CSV data in het tekstveld');
      return;
    }
    
    setIsLoading(true);
    setImportResults(null);
    
    try {
      const response = await fetch('/api/admin/bulk-operations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify({
          operation: 'import',
          data: { csvData }
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setImportResults(data);
        if (data.success && data.imported > 0) {
          loadInfluencers(); // Refresh the list
        }
      }
    } catch (error) {
      console.error('Import error:', error);
      setImportResults({
        success: false,
        error: 'Import fout: ' + error.message
      });
    }
    setIsLoading(false);
  };

  const handleBulkCommissionUpdate = async () => {
    if (selectedInfluencers.length === 0) {
      alert('Selecteer eerst influencers');
      return;
    }
    
    if (!bulkCommission || isNaN(parseFloat(bulkCommission))) {
      alert('Voer een geldige commissie percentage in');
      return;
    }
    
    setBulkLoading(true);
    setBulkResults(null);
    
    try {
      const response = await fetch('/api/admin/bulk-operations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify({
          operation: 'bulk_commission_update',
          data: {
            influencers: selectedInfluencers,
            newCommission: bulkCommission
          }
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setBulkResults(data);
        if (data.success && data.updated > 0) {
          loadInfluencers(); // Refresh the list
          setSelectedInfluencers([]); // Clear selection
        }
      }
    } catch (error) {
      console.error('Bulk commission update error:', error);
      setBulkResults({
        success: false,
        error: 'Update fout: ' + error.message
      });
    }
    setBulkLoading(false);
  };

  const handleBulkStatusUpdate = async () => {
    if (selectedInfluencers.length === 0) {
      alert('Selecteer eerst influencers');
      return;
    }
    
    setBulkLoading(true);
    setBulkResults(null);
    
    try {
      const response = await fetch('/api/admin/bulk-operations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify({
          operation: 'bulk_status_update',
          data: {
            influencers: selectedInfluencers,
            newStatus: bulkStatus
          }
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setBulkResults(data);
        if (data.success && data.updated > 0) {
          loadInfluencers(); // Refresh the list
          setSelectedInfluencers([]); // Clear selection
        }
      }
    } catch (error) {
      console.error('Bulk status update error:', error);
      setBulkResults({
        success: false,
        error: 'Update fout: ' + error.message
      });
    }
    setBulkLoading(false);
  };

  const toggleInfluencerSelection = (influencerRef) => {
    setSelectedInfluencers(prev => 
      prev.includes(influencerRef)
        ? prev.filter(ref => ref !== influencerRef)
        : [...prev, influencerRef]
    );
  };

  const selectAllInfluencers = () => {
    setSelectedInfluencers(allInfluencers.map(inf => inf.ref));
  };

  const clearSelection = () => {
    setSelectedInfluencers([]);
  };

  if (!isAuthenticated || isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-300 mx-auto"></div>
          <p className="mt-4 text-gray-300">
            {!isAuthenticated ? 'Authenticatie controleren...' : 'Bulk Operations laden...'}
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <div className="ml-3">
                <h1 className="text-xl font-semibold text-white">Bulk Operations</h1>
                <p className="text-sm text-gray-400">CSV Import/Export & Bulk Updates</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/admin/dashboard')}
                className="flex items-center px-3 py-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition-colors text-sm font-medium"
              >
                <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Dashboard
              </button>
              <button
                onClick={handleLogout}
                className="text-gray-300 hover:text-white px-3 py-2 rounded-lg text-sm font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="border-b border-gray-700">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('export')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'export'
                    ? 'border-blue-500 text-blue-400'
                    : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                }`}
              >
                CSV Export
              </button>
              <button
                onClick={() => setActiveTab('import')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'import'
                    ? 'border-blue-500 text-blue-400'
                    : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                }`}
              >
                CSV Import
              </button>
              <button
                onClick={() => setActiveTab('bulk')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'bulk'
                    ? 'border-blue-500 text-blue-400'
                    : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                }`}
              >
                Bulk Updates
              </button>
            </nav>
          </div>
        </div>

        {/* CSV Export Tab */}
        {activeTab === 'export' && (
          <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-white mb-4">CSV Export</h2>
            <p className="text-gray-400 mb-6">
              Exporteer alle influencer data naar een CSV bestand voor backup of externe verwerking.
            </p>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={handleExportCSV}
                disabled={exportLoading}
                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-6 py-2 rounded-lg transition-colors flex items-center"
              >
                {exportLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                )}
                {exportLoading ? 'Exporteren...' : 'Export naar CSV'}
              </button>
              <span className="text-gray-400 text-sm">
                {allInfluencers.length} influencers beschikbaar
              </span>
            </div>
          </div>
        )}

        {/* CSV Import Tab */}
        {activeTab === 'import' && (
          <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-white mb-4">CSV Import</h2>
            <p className="text-gray-400 mb-6">
              Importeer influencers vanuit CSV data. Vereiste kolommen: ref, email. Optioneel: name, phone, commission, status, instagram, tiktok, youtube, notes.
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  CSV Data (plak hier je CSV inhoud)
                </label>
                <textarea
                  value={csvData}
                  onChange={(e) => setCsvData(e.target.value)}
                  className="w-full h-40 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="ref,name,email,phone,commission,status,instagram,tiktok,youtube,notes&#10;testuser,Test User,test@example.com,123456789,12.5,active,@test,@test,@test,Test notes"
                />
              </div>
              
              <button
                onClick={handleImportCSV}
                disabled={isLoading || !csvData.trim()}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-6 py-2 rounded-lg transition-colors flex items-center"
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                  </svg>
                )}
                {isLoading ? 'Importeren...' : 'Importeer CSV'}
              </button>
            </div>

            {/* Import Results */}
            {importResults && (
              <div className={`mt-6 p-4 rounded-lg ${
                importResults.success ? 'bg-green-900/20 border border-green-800' : 'bg-red-900/20 border border-red-800'
              }`}>
                <h3 className={`font-medium ${importResults.success ? 'text-green-300' : 'text-red-300'}`}>
                  Import Resultaten
                </h3>
                {importResults.success ? (
                  <div className="mt-2 text-sm text-green-200">
                    <p>✅ {importResults.imported} influencers succesvol geïmporteerd</p>
                    <p>📊 {importResults.total} totaal verwerkt</p>
                    {importResults.errors && importResults.errors.length > 0 && (
                      <div className="mt-2">
                        <p className="text-yellow-300">⚠️ {importResults.errors.length} waarschuwingen:</p>
                        <ul className="list-disc list-inside mt-1 text-yellow-200">
                          {importResults.errors.slice(0, 5).map((error, index) => (
                            <li key={index}>{error}</li>
                          ))}
                          {importResults.errors.length > 5 && (
                            <li>... en {importResults.errors.length - 5} meer</li>
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-red-200">
                    ❌ {importResults.error}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Bulk Updates Tab */}
        {activeTab === 'bulk' && (
          <div className="space-y-6">
            {/* Influencer Selection */}
            <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-white">Influencer Selectie</h2>
                <div className="flex space-x-2">
                  <button
                    onClick={selectAllInfluencers}
                    className="text-blue-400 hover:text-blue-300 text-sm"
                  >
                    Selecteer Alles
                  </button>
                  <span className="text-gray-500">•</span>
                  <button
                    onClick={clearSelection}
                    className="text-red-400 hover:text-red-300 text-sm"
                  >
                    Wis Selectie
                  </button>
                </div>
              </div>
              
              <p className="text-gray-400 mb-4">
                {selectedInfluencers.length} van {allInfluencers.length} influencers geselecteerd
              </p>
              
              <div className="max-h-64 overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {allInfluencers.map((influencer) => (
                    <label key={influencer.ref} className="flex items-center space-x-3 p-3 bg-gray-700 rounded-lg hover:bg-gray-600 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedInfluencers.includes(influencer.ref)}
                        onChange={() => toggleInfluencerSelection(influencer.ref)}
                        className="rounded border-gray-600 text-blue-600 focus:ring-blue-500 focus:ring-offset-gray-800"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{influencer.ref}</p>
                        <p className="text-xs text-gray-400 truncate">{influencer.email}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Bulk Operations */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Bulk Commission Update */}
              <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Bulk Commissie Update</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Nieuwe Commissie Percentage
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={bulkCommission}
                      onChange={(e) => setBulkCommission(e.target.value)}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="12.5"
                    />
                  </div>
                  <button
                    onClick={handleBulkCommissionUpdate}
                    disabled={bulkLoading || selectedInfluencers.length === 0 || !bulkCommission}
                    className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center"
                  >
                    {bulkLoading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    ) : (
                      <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                    )}
                    Update Commissies
                  </button>
                </div>
              </div>

              {/* Bulk Status Update */}
              <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Bulk Status Update</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Nieuwe Status
                    </label>
                    <select
                      value={bulkStatus}
                      onChange={(e) => setBulkStatus(e.target.value)}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                  <button
                    onClick={handleBulkStatusUpdate}
                    disabled={bulkLoading || selectedInfluencers.length === 0}
                    className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center"
                  >
                    {bulkLoading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    ) : (
                      <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                    Update Status
                  </button>
                </div>
              </div>
            </div>

            {/* Bulk Results */}
            {bulkResults && (
              <div className={`p-4 rounded-lg ${
                bulkResults.success ? 'bg-green-900/20 border border-green-800' : 'bg-red-900/20 border border-red-800'
              }`}>
                <h3 className={`font-medium ${bulkResults.success ? 'text-green-300' : 'text-red-300'}`}>
                  Bulk Update Resultaten
                </h3>
                {bulkResults.success ? (
                  <div className="mt-2 text-sm text-green-200">
                    <p>✅ {bulkResults.updated} influencers succesvol bijgewerkt</p>
                    <p>📊 {bulkResults.total} totaal verwerkt</p>
                    {bulkResults.errors && bulkResults.errors.length > 0 && (
                      <div className="mt-2">
                        <p className="text-yellow-300">⚠️ {bulkResults.errors.length} fouten:</p>
                        <ul className="list-disc list-inside mt-1 text-yellow-200">
                          {bulkResults.errors.slice(0, 5).map((error, index) => (
                            <li key={index}>{error}</li>
                          ))}
                          {bulkResults.errors.length > 5 && (
                            <li>... en {bulkResults.errors.length - 5} meer</li>
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-red-200">
                    ❌ {bulkResults.error}
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
} 