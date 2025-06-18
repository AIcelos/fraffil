import { useState } from 'react';
import { useRouter } from 'next/router';

export default function EmailTester() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const router = useRouter();

  const emailTypes = [
    {
      type: 'welcome',
      name: '🎉 Welkomst Email',
      description: 'Email die wordt verstuurd bij nieuwe registraties'
    },
    {
      type: 'sale',
      name: '💰 Verkoop Notificatie',
      description: 'Email bij nieuwe verkoop/commissie'
    },
    {
      type: 'weekly',
      name: '📈 Wekelijks Rapport',
      description: 'Wekelijkse prestatie samenvatting'
    },
    {
      type: 'password-reset',
      name: '🔐 Wachtwoord Reset',
      description: 'Email voor wachtwoord herstel'
    }
  ];

  const sendTestEmail = async (type) => {
    if (!email) {
      alert('Voer eerst een email adres in');
      return;
    }

    setLoading(true);
    
    try {
      const response = await fetch('/api/test-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: type,
          email: email
        }),
      });

      const result = await response.json();
      
      const newResult = {
        id: Date.now(),
        type: type,
        success: result.success,
        message: result.message,
        messageId: result.messageId,
        error: result.error,
        timestamp: new Date().toLocaleTimeString('nl-NL')
      };

      setResults(prev => [newResult, ...prev]);

      if (result.success) {
        alert(`✅ ${type} email succesvol verstuurd!`);
      } else {
        alert(`❌ Fout: ${result.error}`);
      }

    } catch (error) {
      console.error('Email test error:', error);
      alert('Er ging iets mis bij het versturen van de test email');
    } finally {
      setLoading(false);
    }
  };

  const sendAllEmails = async () => {
    if (!email) {
      alert('Voer eerst een email adres in');
      return;
    }

    for (const emailType of emailTypes) {
      await sendTestEmail(emailType.type);
      // Kleine pauze tussen emails
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                📧 Email Template Tester
              </h1>
              <p className="text-gray-600">
                Test alle email templates en bekijk hoe ze eruit zien
              </p>
            </div>
            <button
              onClick={() => router.push('/admin/dashboard')}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              ← Terug naar Dashboard
            </button>
          </div>
        </div>

        {/* Email Input */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Email Adres</h2>
          <div className="flex gap-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="test@example.com"
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            <button
              onClick={sendAllEmails}
              disabled={loading || !email}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
            >
              {loading ? '⏳ Bezig...' : '🚀 Test Alle Templates'}
            </button>
          </div>
        </div>

        {/* Email Types Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {emailTypes.map((emailType) => (
            <div key={emailType.type} className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {emailType.name}
                  </h3>
                  <p className="text-gray-600 text-sm">
                    {emailType.description}
                  </p>
                </div>
              </div>
              
              <button
                onClick={() => sendTestEmail(emailType.type)}
                disabled={loading || !email}
                className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
              >
                {loading ? '⏳ Versturen...' : `📤 Test ${emailType.type}`}
              </button>
            </div>
          ))}
        </div>

        {/* Results */}
        {results.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Test Resultaten</h2>
              <button
                onClick={() => setResults([])}
                className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded transition-colors"
              >
                Wissen
              </button>
            </div>
            
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {results.map((result) => (
                <div
                  key={result.id}
                  className={`p-4 rounded-lg border-l-4 ${
                    result.success 
                      ? 'bg-green-50 border-green-500' 
                      : 'bg-red-50 border-red-500'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">
                      {result.success ? '✅' : '❌'} {result.type} email
                    </span>
                    <span className="text-sm text-gray-500">
                      {result.timestamp}
                    </span>
                  </div>
                  
                  <p className={`text-sm ${
                    result.success ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {result.message}
                  </p>
                  
                  {result.messageId && (
                    <p className="text-xs text-gray-500 mt-1">
                      Message ID: {result.messageId}
                    </p>
                  )}
                  
                  {result.error && (
                    <p className="text-xs text-red-600 mt-1">
                      Error: {result.error}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Template Customization */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">🎨 Template Aanpassingen</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium mb-2">Brand Kleuren</h3>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 rounded" style={{background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'}}></div>
                  <span className="text-sm">Primary Gradient (#667eea → #764ba2)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-gray-900 rounded"></div>
                  <span className="text-sm">Text Color (#1f2937)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-gray-600 rounded"></div>
                  <span className="text-sm">Secondary Text (#4b5563)</span>
                </div>
              </div>
            </div>
            <div>
              <h3 className="font-medium mb-2">Template Features</h3>
              <ul className="text-sm space-y-1 text-gray-600">
                <li>✅ Responsive design voor alle devices</li>
                <li>✅ Dark mode compatible</li>
                <li>✅ Professional typography</li>
                <li>✅ Consistent branding</li>
                <li>✅ Social media integration</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Advanced Testing */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">🧪 Geavanceerd Testen</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <button
              onClick={() => window.open('/api/test-email-config', '_blank')}
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
            >
              <h3 className="font-medium text-gray-900 mb-1">Email Config</h3>
              <p className="text-sm text-gray-600">Test email configuratie en API keys</p>
            </button>
            
            <button
              onClick={() => {
                const testData = {
                  type: 'welcome',
                  email: email || 'test@example.com'
                };
                navigator.clipboard.writeText(JSON.stringify(testData, null, 2));
                alert('Test data gekopieerd naar clipboard!');
              }}
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
            >
              <h3 className="font-medium text-gray-900 mb-1">API Data</h3>
              <p className="text-sm text-gray-600">Kopieer test JSON naar clipboard</p>
            </button>
            
            <button
              onClick={() => window.open('https://resend.com/emails', '_blank')}
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
            >
              <h3 className="font-medium text-gray-900 mb-1">Resend Dashboard</h3>
              <p className="text-sm text-gray-600">Bekijk email logs en analytics</p>
            </button>
          </div>
        </div>

        {/* Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mt-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">
            ℹ️ Informatie
          </h3>
          <ul className="text-blue-800 space-y-2 text-sm">
            <li>• Alle emails worden verstuurd via Resend met het domein filright.com</li>
            <li>• Test emails bevatten voorbeelddata om de templates te demonstreren</li>
            <li>• Check je spam folder als je de emails niet ontvangt</li>
            <li>• De templates zijn responsive en werken op alle email clients</li>
            <li>• Elke email heeft een unieke preheader tekst voor betere deliverability</li>
            <li>• Template aanpassingen kunnen worden gemaakt in <code>lib/email.js</code></li>
          </ul>
        </div>
      </div>
    </div>
  );
}

// Eenvoudige authenticatie check
export async function getServerSideProps(context) {
  // In productie zou je hier een echte auth check doen
  return {
    props: {}
  };
} 