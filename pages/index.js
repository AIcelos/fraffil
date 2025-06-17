import Head from 'next/head';
import Link from 'next/link';

export default function Home() {
  return (
    <>
      <Head>
        <title>Filright Affiliate System</title>
        <meta name="description" content="Affiliate tracking system voor Filright" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        {/* Header */}
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div className="flex items-center">
                <h1 className="text-2xl font-bold text-gray-900">
                  Filright Affiliate System
                </h1>
              </div>
              <Link
                href="/dashboard/login"
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
              >
                Influencer Login
              </Link>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <main className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-4xl font-extrabold text-gray-900 sm:text-5xl">
              Affiliate Tracking
            </h2>
            <p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto">
              Een krachtig systeem voor het bijhouden van affiliate verkopen via Lightspeed C-Series, 
              Zapier integratie en Google Sheets opslag.
            </p>
          </div>

          {/* Features Grid */}
          <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-blue-600 text-2xl">🎯</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Real-time Tracking
              </h3>
              <p className="text-gray-600">
                Automatische detectie van affiliate verkopen op de bedankpagina van Lightspeed C-Series.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-green-600 text-2xl">⚡</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Zapier Integratie
              </h3>
              <p className="text-gray-600">
                Naadloze integratie met Zapier voor automatische data verwerking naar Google Sheets.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-purple-600 text-2xl">📊</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Influencer Dashboard
              </h3>
              <p className="text-gray-600">
                Persoonlijke dashboards voor influencers om hun performance en verdiensten te volgen.
              </p>
            </div>
          </div>

          {/* How it Works */}
          <div className="mt-16">
            <h3 className="text-2xl font-bold text-gray-900 text-center mb-8">
              Hoe het werkt
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-indigo-600 text-2xl font-bold">1</span>
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Share Link</h4>
                <p className="text-sm text-gray-600">
                  Influencer deelt filright.com?ref=username
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-indigo-600 text-2xl font-bold">2</span>
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Cookie Storage</h4>
                <p className="text-sm text-gray-600">
                  Ref parameter wordt 30 dagen opgeslagen
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-indigo-600 text-2xl font-bold">3</span>
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Purchase Tracking</h4>
                <p className="text-sm text-gray-600">
                  Bij aankoop: automatische detectie op bedankpagina
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-indigo-600 text-2xl font-bold">4</span>
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Data Storage</h4>
                <p className="text-sm text-gray-600">
                  Via Zapier naar Google Sheets + Dashboard update
                </p>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="mt-16 text-center">
            <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl mx-auto">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Ready to Start?
              </h3>
              <p className="text-gray-600 mb-6">
                Ben je een influencer? Log in om je persoonlijke dashboard te bekijken en je referral links te beheren.
              </p>
              <Link
                href="/dashboard/login"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
              >
                🚀 Naar Dashboard
              </Link>
            </div>
          </div>

          {/* Status */}
          <div className="mt-8 text-center">
            <div className="inline-flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              System Status: Active & Tracking
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-white border-t">
          <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
            <div className="text-center text-gray-500">
              <p>© 2025 Filright Affiliate System</p>
              <p className="mt-2 text-sm">
                Powered by Next.js • Vercel • Zapier • Google Sheets
              </p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
} 