import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

const LoginPage = () => {
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError(''); // Clear error when user types
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/dashboard/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        // Store login info in localStorage
        localStorage.setItem('influencer', JSON.stringify(data.influencer));
        
        // Redirect to dashboard
        router.push('/dashboard');
      } else {
        setError(data.error || 'Inloggen mislukt');
      }
    } catch (err) {
      setError('Er ging iets mis. Probeer opnieuw.');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Influencer Dashboard - Login</title>
        <meta name="description" content="Login voor Filright influencers" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          {/* Header */}
          <div className="text-center">
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              Influencer Dashboard
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Log in om je performance te bekijken
            </p>
          </div>

          {/* Login Form */}
          <form className="mt-8 space-y-6 bg-white p-8 rounded-xl shadow-lg" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                  Gebruikersnaam
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={formData.username}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  placeholder="Je gebruikersnaam"
                />
              </div>
              
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Wachtwoord
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  placeholder="Je wachtwoord"
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Inloggen...
                </div>
              ) : (
                'Inloggen'
              )}
            </button>

            {/* Registration Link */}
            <div className="text-center">
              <p className="text-sm text-gray-600">
                Nog geen account?{' '}
                <a 
                  href="/register" 
                  className="font-medium text-indigo-600 hover:text-indigo-500 transition-colors"
                >
                  🚀 Registreer als nieuwe affiliate
                </a>
              </p>
            </div>

            {/* Demo credentials */}
            <div className="mt-6 p-4 bg-gray-50 rounded-md">
              <h3 className="text-sm font-medium text-gray-900 mb-2">Demo accounts:</h3>
              <div className="text-xs text-gray-600 space-y-1">
                <div>• annemieke / annemieke123 (mock data)</div>
                <div>• stefan / stefan123 (mock data)</div>
                <div className="border-t pt-2 mt-2">
                  <strong>🎯 Echte data uit Google Sheets:</strong>
                </div>
                <div>• finaltest / finaltest123 (2 verkopen)</div>
                <div>• manual-test-456 / test123 (1 verkoop)</div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default LoginPage; 