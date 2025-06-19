import { useState } from 'react';
import { useRouter } from 'next/router';

export default function AdminLoginDebug() {
  const [credentials, setCredentials] = useState({ username: 'sven', password: 'sven_admin_2025' });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [debugInfo, setDebugInfo] = useState('');
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setDebugInfo('');

    try {
      setDebugInfo('🔄 Starting login request...');
      
      const requestBody = JSON.stringify(credentials);
      setDebugInfo(prev => prev + '\n📤 Request body: ' + requestBody);
      
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: requestBody
      });

      setDebugInfo(prev => prev + `\n📥 Response status: ${response.status} ${response.statusText}`);
      
      const data = await response.json();
      setDebugInfo(prev => prev + '\n📄 Response data: ' + JSON.stringify(data, null, 2));

      if (data.success) {
        setDebugInfo(prev => prev + '\n✅ Login successful!');
        localStorage.setItem('adminToken', data.token);
        localStorage.setItem('adminUser', JSON.stringify(data.admin));
        router.push('/admin/dashboard');
      } else {
        setError(data.error || 'Login failed');
        setDebugInfo(prev => prev + '\n❌ Login failed: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      setError('Network error. Please try again.');
      setDebugInfo(prev => prev + '\n💥 Network error: ' + error.message);
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const testApiDirectly = async () => {
    setDebugInfo('🧪 Testing API directly...');
    try {
      const response = await fetch('/api/admin/test-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      });
      
      const data = await response.json();
      setDebugInfo(prev => prev + '\n🧪 Test API response: ' + JSON.stringify(data, null, 2));
    } catch (error) {
      setDebugInfo(prev => prev + '\n💥 Test API error: ' + error.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold text-white">
            Admin Login Debug
          </h2>
          <p className="mt-2 text-sm text-gray-400">
            Debug version with detailed logging
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-1">
                Admin Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                className="appearance-none relative block w-full px-3 py-3 border border-gray-600 placeholder-gray-400 text-white bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 focus:z-10"
                placeholder="Enter admin username"
                value={credentials.username}
                onChange={(e) => setCredentials({...credentials, username: e.target.value})}
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="appearance-none relative block w-full px-3 py-3 border border-gray-600 placeholder-gray-400 text-white bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 focus:z-10"
                placeholder="Enter admin password"
                value={credentials.password}
                onChange={(e) => setCredentials({...credentials, password: e.target.value})}
              />
            </div>
          </div>

          <div className="flex space-x-4">
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 group relative flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-gray-700 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {isLoading ? 'Logging in...' : 'Sign In'}
            </button>
            
            <button
              type="button"
              onClick={testApiDirectly}
              className="px-4 py-3 border border-gray-600 text-sm font-medium rounded-lg text-gray-300 hover:text-white hover:bg-gray-700 transition-all duration-200"
            >
              Test API
            </button>
          </div>

          {error && (
            <div className="bg-red-900/20 border border-red-800 text-red-300 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {debugInfo && (
            <div className="bg-gray-800 border border-gray-600 text-gray-300 px-4 py-3 rounded-lg">
              <h3 className="font-medium mb-2">Debug Information:</h3>
              <pre className="text-xs whitespace-pre-wrap">{debugInfo}</pre>
            </div>
          )}
        </form>

        <div className="text-center">
          <a href="/admin/login" className="text-sm text-gray-400 hover:text-white">
            ← Back to normal login
          </a>
        </div>
      </div>
    </div>
  );
} 