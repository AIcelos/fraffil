import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

export default function InvoicesPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [adminUser, setAdminUser] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [influencers, setInfluencers] = useState([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    influencer: '',
    dateFrom: '',
    dateTo: ''
  });
  const [isSetupMode, setIsSetupMode] = useState(false);
  const [setupComplete, setSetupComplete] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const adminToken = localStorage.getItem('adminToken');
    const storedAdminUser = localStorage.getItem('adminUser');
    
    if (adminToken && storedAdminUser) {
      setAdminUser(JSON.parse(storedAdminUser));
      setIsAuthenticated(true);
      loadData();
    } else {
      router.push('/admin/login');
    }
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      
      // Load invoices
      const params = new URLSearchParams(filters);
      const invoicesResponse = await fetch(`/api/admin/invoices?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
      
      if (invoicesResponse.ok) {
        const invoicesData = await invoicesResponse.json();
        if (invoicesData.success) {
          setInvoices(invoicesData.data);
        }
      }

      // Load influencers for dropdown
      const influencersResponse = await fetch('/api/admin/users-db', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
      
      if (influencersResponse.ok) {
        const influencersData = await influencersResponse.json();
        if (influencersData.success) {
          setInfluencers(influencersData.users || []);
        }
      }

    } catch (error) {
      console.error('❌ Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetupDatabase = async () => {
    try {
      setIsSetupMode(true);
      
      const response = await fetch('/api/admin/invoices/setup', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setSetupComplete(true);
          setTimeout(() => {
            setIsSetupMode(false);
            loadData();
          }, 1500);
        }
      }
    } catch (error) {
      console.error('❌ Setup error:', error);
      setIsSetupMode(false);
    }
  };

  const handleCreateInvoice = async (invoiceData) => {
    try {
      const response = await fetch('/api/admin/invoices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify(invoiceData)
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setIsCreateModalOpen(false);
          loadData();
          console.log('✅ Invoice created:', data.data.invoice_number);
        }
      }
    } catch (error) {
      console.error('❌ Create invoice error:', error);
    }
  };

  const handleUpdateInvoiceStatus = async (invoiceId, status, paymentData = {}) => {
    try {
      const response = await fetch('/api/admin/invoices', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify({
          id: invoiceId,
          status,
          ...paymentData
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          loadData();
          console.log('✅ Invoice status updated');
        }
      }
    } catch (error) {
      console.error('❌ Update invoice error:', error);
    }
  };

  const handleDownloadPDF = async (invoiceId, invoiceNumber) => {
    try {
      const response = await fetch(`/api/admin/invoices/pdf/${invoiceId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Factuur_${invoiceNumber}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        console.log('✅ PDF downloaded:', invoiceNumber);
      }
    } catch (error) {
      console.error('❌ PDF download error:', error);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'draft': return 'bg-gray-900 text-gray-200';
      case 'sent': return 'bg-blue-900 text-blue-200';
      case 'paid': return 'bg-green-900 text-green-200';
      case 'overdue': return 'bg-red-900 text-red-200';
      case 'cancelled': return 'bg-red-900 text-red-200';
      default: return 'bg-gray-900 text-gray-200';
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    router.push('/admin/login');
  };

  if (!isAuthenticated || isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-300 mx-auto"></div>
          <p className="mt-4 text-gray-300">Invoice systeem laden...</p>
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
              <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="ml-3">
                <h1 className="text-xl font-semibold text-white">Invoice Management</h1>
                <p className="text-sm text-gray-400">Professionele factuur administratie</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/admin/dashboard')}
                className="text-gray-300 hover:text-white transition-colors"
              >
                ← Terug naar Dashboard
              </button>
              <div className="text-right">
                <p className="text-sm font-medium text-white">{adminUser?.username}</p>
                <button
                  onClick={handleLogout}
                  className="text-xs text-gray-400 hover:text-white transition-colors"
                >
                  Uitloggen
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Setup Mode */}
        {isSetupMode && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-lg p-8 max-w-md w-full mx-4">
              <div className="text-center">
                {setupComplete ? (
                  <>
                    <div className="h-16 w-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">Setup Voltooid!</h3>
                    <p className="text-gray-300">Invoice database is succesvol opgezet.</p>
                  </>
                ) : (
                  <>
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <h3 className="text-lg font-semibold text-white mb-2">Database Setup</h3>
                    <p className="text-gray-300">Invoice tabellen worden aangemaakt...</p>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Actions Bar */}
        <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 mb-6">
          <div className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Nieuwe Factuur
                </button>
                
                <button
                  onClick={handleSetupDatabase}
                  className="flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Database Setup
                </button>
              </div>

              {/* Filters */}
              <div className="flex items-center space-x-2">
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({...filters, status: e.target.value})}
                  className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Alle statussen</option>
                  <option value="draft">Concept</option>
                  <option value="sent">Verzonden</option>
                  <option value="paid">Betaald</option>
                  <option value="overdue">Vervallen</option>
                  <option value="cancelled">Geannuleerd</option>
                </select>

                <select
                  value={filters.influencer}
                  onChange={(e) => setFilters({...filters, influencer: e.target.value})}
                  className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Alle influencers</option>
                  {influencers.map(inf => (
                    <option key={inf.ref} value={inf.ref}>{inf.ref}</option>
                  ))}
                </select>

                <button
                  onClick={loadData}
                  className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm transition-colors"
                >
                  Filter
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Invoices Table */}
        <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-700">
          <div className="px-6 py-4 border-b border-gray-700">
            <h2 className="text-lg font-semibold text-white">Facturen Overzicht</h2>
            <p className="text-sm text-gray-400 mt-1">Beheer alle facturen en betalingen</p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-700">
              <thead className="bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Factuur
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Influencer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Bedrag
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Datum
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Vervaldatum
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Acties
                  </th>
                </tr>
              </thead>
              <tbody className="bg-gray-800 divide-y divide-gray-700">
                {invoices.length > 0 ? invoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-white">{invoice.invoice_number}</div>
                      <div className="text-sm text-gray-400">
                        {new Date(invoice.period_start).toLocaleDateString('nl-NL')} - {new Date(invoice.period_end).toLocaleDateString('nl-NL')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-white">{invoice.influencer_name}</div>
                      <div className="text-sm text-gray-400">{invoice.influencer_ref}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-green-400">{formatCurrency(invoice.total_amount)}</div>
                      <div className="text-sm text-gray-400">BTW: {formatCurrency(invoice.btw_amount)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(invoice.status)}`}>
                        {invoice.status === 'draft' ? 'Concept' :
                         invoice.status === 'sent' ? 'Verzonden' :
                         invoice.status === 'paid' ? 'Betaald' :
                         invoice.status === 'overdue' ? 'Vervallen' :
                         invoice.status === 'cancelled' ? 'Geannuleerd' : invoice.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                      {new Date(invoice.invoice_date).toLocaleDateString('nl-NL')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                      {new Date(invoice.due_date).toLocaleDateString('nl-NL')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            setSelectedInvoice(invoice);
                            setIsViewModalOpen(true);
                          }}
                          className="text-blue-400 hover:text-blue-300"
                        >
                          Bekijk
                        </button>
                        <button
                          onClick={() => handleDownloadPDF(invoice.id, invoice.invoice_number)}
                          className="text-green-400 hover:text-green-300"
                        >
                          PDF
                        </button>
                        {invoice.status === 'draft' && (
                          <button
                            onClick={() => handleUpdateInvoiceStatus(invoice.id, 'sent')}
                            className="text-yellow-400 hover:text-yellow-300"
                          >
                            Verzend
                          </button>
                        )}
                        {(invoice.status === 'sent' || invoice.status === 'overdue') && (
                          <button
                            onClick={() => {
                              const paymentDate = prompt('Betaaldatum (YYYY-MM-DD):');
                              const paymentRef = prompt('Betalingsreferentie (optioneel):');
                              if (paymentDate) {
                                handleUpdateInvoiceStatus(invoice.id, 'paid', {
                                  payment_date: paymentDate,
                                  payment_reference: paymentRef || null
                                });
                              }
                            }}
                            className="text-green-400 hover:text-green-300"
                          >
                            Betaald
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center">
                      <div className="text-gray-400">
                        <svg className="mx-auto h-12 w-12 text-gray-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p className="text-lg font-medium text-gray-300 mb-2">Geen facturen gevonden</p>
                        <p className="text-sm">Maak je eerste factuur aan om te beginnen</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Create Invoice Modal */}
      {isCreateModalOpen && (
        <CreateInvoiceModal
          influencers={influencers}
          onClose={() => setIsCreateModalOpen(false)}
          onCreate={handleCreateInvoice}
        />
      )}

      {/* View Invoice Modal */}
      {isViewModalOpen && selectedInvoice && (
        <ViewInvoiceModal
          invoice={selectedInvoice}
          onClose={() => {
            setIsViewModalOpen(false);
            setSelectedInvoice(null);
          }}
          onDownloadPDF={() => handleDownloadPDF(selectedInvoice.id, selectedInvoice.invoice_number)}
        />
      )}
    </div>
  );
}

// Create Invoice Modal Component
const CreateInvoiceModal = ({ influencers, onClose, onCreate }) => {
  const [formData, setFormData] = useState({
    influencerRef: '',
    influencerName: '',
    influencerEmail: '',
    periodStart: '',
    periodEnd: '',
    autoGenerateFromCommissions: true,
    notes: ''
  });

  const handleInfluencerChange = (e) => {
    const selectedRef = e.target.value;
    const influencer = influencers.find(inf => inf.ref === selectedRef);
    
    setFormData({
      ...formData,
      influencerRef: selectedRef,
      influencerName: influencer?.name || '',
      influencerEmail: influencer?.email || ''
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onCreate(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-white">Nieuwe Factuur</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Influencer
            </label>
            <select
              value={formData.influencerRef}
              onChange={handleInfluencerChange}
              required
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Selecteer influencer</option>
              {influencers.map(inf => (
                <option key={inf.ref} value={inf.ref}>{inf.ref} - {inf.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Periode Start
              </label>
              <input
                type="date"
                value={formData.periodStart}
                onChange={(e) => setFormData({...formData, periodStart: e.target.value})}
                required
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Periode Eind
              </label>
              <input
                type="date"
                value={formData.periodEnd}
                onChange={(e) => setFormData({...formData, periodEnd: e.target.value})}
                required
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.autoGenerateFromCommissions}
                onChange={(e) => setFormData({...formData, autoGenerateFromCommissions: e.target.checked})}
                className="rounded border-gray-600 text-blue-600 focus:ring-blue-500 focus:ring-offset-0 bg-gray-700"
              />
              <span className="ml-2 text-sm text-gray-300">
                Automatisch commissies uit Google Sheets ophalen
              </span>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Opmerkingen (optioneel)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              rows={3}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Eventuele opmerkingen voor de factuur..."
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
            >
              Annuleren
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Factuur Aanmaken
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// View Invoice Modal Component
const ViewInvoiceModal = ({ invoice, onClose, onDownloadPDF }) => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-screen overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-white">
            Factuur {invoice.invoice_number}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-6">
          {/* Invoice Details */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium text-gray-300 mb-2">Influencer</h4>
              <p className="text-white">{invoice.influencer_name}</p>
              <p className="text-gray-400 text-sm">{invoice.influencer_email}</p>
              <p className="text-gray-400 text-sm">Ref: {invoice.influencer_ref}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-300 mb-2">Factuurgegevens</h4>
              <p className="text-white">Datum: {new Date(invoice.invoice_date).toLocaleDateString('nl-NL')}</p>
              <p className="text-white">Vervaldatum: {new Date(invoice.due_date).toLocaleDateString('nl-NL')}</p>
              <p className="text-white">Periode: {new Date(invoice.period_start).toLocaleDateString('nl-NL')} - {new Date(invoice.period_end).toLocaleDateString('nl-NL')}</p>
            </div>
          </div>

          {/* Amounts */}
          <div className="bg-gray-700 rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-300">Subtotaal:</span>
              <span className="text-white">{formatCurrency(invoice.subtotal)}</span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-300">BTW ({parseFloat(invoice.btw_rate).toFixed(0)}%):</span>
              <span className="text-white">{formatCurrency(invoice.btw_amount)}</span>
            </div>
            <div className="flex justify-between items-center text-lg font-semibold pt-2 border-t border-gray-600">
              <span className="text-white">Totaal:</span>
              <span className="text-green-400">{formatCurrency(invoice.total_amount)}</span>
            </div>
          </div>

          {/* Notes */}
          {invoice.notes && (
            <div>
              <h4 className="text-sm font-medium text-gray-300 mb-2">Opmerkingen</h4>
              <p className="text-gray-300 bg-gray-700 rounded-lg p-3">{invoice.notes}</p>
            </div>
          )}

          {/* Payment Info */}
          {invoice.payment_date && (
            <div>
              <h4 className="text-sm font-medium text-gray-300 mb-2">Betalingsinformatie</h4>
              <p className="text-green-400">Betaald op: {new Date(invoice.payment_date).toLocaleDateString('nl-NL')}</p>
              {invoice.payment_reference && (
                <p className="text-gray-300">Referentie: {invoice.payment_reference}</p>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-700">
            <button
              onClick={onDownloadPDF}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center"
            >
              <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Download PDF
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
            >
              Sluiten
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}; 