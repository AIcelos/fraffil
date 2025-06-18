import Head from 'next/head';
import Link from 'next/link';
import { useState } from 'react';

export default function Home() {
  const [calculatorAmount, setCalculatorAmount] = useState(1000);
  const [hoveredFeature, setHoveredFeature] = useState(null);

  const calculateEarnings = (amount, commission = 7) => {
    return (amount * commission / 100).toFixed(2);
  };

  return (
    <>
      <Head>
        <title>Filright Affiliate - Verdien met Jouw Invloed | Influencer Platform</title>
        <meta name="description" content="Verdien tot 7% commissie op elke verkoop! Join het Filright Affiliate programma en monetiseer je social media influence. Real-time tracking, automatische uitbetalingen." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="keywords" content="affiliate marketing, influencer, commissie, verdienen, social media, instagram, tiktok, youtube" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xl">F</span>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Filright</h1>
                  <p className="text-xs text-gray-500">Affiliate Platform</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <Link
                  href="/admin/login"
                  className="text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors"
                >
                  Admin
                </Link>
                <Link
                  href="/dashboard/login"
                  className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  Login Dashboard
                </Link>
              </div>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <main className="relative">
          {/* Background Elements */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-40 -right-32 w-96 h-96 bg-gradient-to-br from-indigo-200 to-purple-200 rounded-full opacity-20 blur-3xl"></div>
            <div className="absolute -bottom-40 -left-32 w-96 h-96 bg-gradient-to-br from-purple-200 to-pink-200 rounded-full opacity-20 blur-3xl"></div>
          </div>

          <div className="relative max-w-7xl mx-auto pt-16 pb-24 px-4 sm:px-6 lg:px-8">
            {/* Hero Content */}
            <div className="text-center max-w-4xl mx-auto">
              <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-full text-sm font-medium text-indigo-700 mb-8">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
                Live tracking systeem actief
              </div>
              
              <h2 className="text-5xl md:text-7xl font-extrabold text-gray-900 mb-6 leading-tight">
                Verdien met
                <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent"> Jouw Invloed</span>
              </h2>
              
              <p className="text-xl md:text-2xl text-gray-600 mb-8 leading-relaxed">
                Join het Filright Affiliate programma en verdien <strong className="text-indigo-600">tot 7% commissie</strong> op elke verkoop. 
                Real-time tracking, automatische uitbetalingen, en een persoonlijk dashboard.
              </p>

              {/* Quick Calculator */}
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 shadow-xl max-w-md mx-auto mb-12 border border-white/20">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">💰 Verdien Calculator</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Maandelijkse verkopen die je genereert:
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">€</span>
                      <input
                        type="number"
                        value={calculatorAmount}
                        onChange={(e) => setCalculatorAmount(Number(e.target.value))}
                        className="w-full pl-8 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        min="0"
                        step="100"
                      />
                    </div>
                  </div>
                  <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-4">
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Jouw maandelijkse verdiensten:</p>
                      <p className="text-3xl font-bold text-indigo-600">
                        €{calculateEarnings(calculatorAmount)}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">Bij 7% commissie</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
                <Link
                  href="/dashboard/login"
                  className="group px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 font-semibold shadow-xl hover:shadow-2xl transform hover:-translate-y-1 text-lg"
                >
                  🚀 Start Nu - Gratis Aanmelden
                  <span className="ml-2 group-hover:translate-x-1 transition-transform duration-200">→</span>
                </Link>
                <button className="px-8 py-4 border-2 border-gray-300 text-gray-700 rounded-full hover:border-indigo-600 hover:text-indigo-600 transition-all duration-200 font-semibold">
                  📹 Bekijk Demo (2 min)
                </button>
              </div>

              {/* Trust Indicators */}
              <div className="flex flex-wrap justify-center items-center gap-8 text-gray-500 text-sm">
                <div className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  Geen setup kosten
                </div>
                <div className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  Automatische tracking
                </div>
                <div className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  Realtime dashboard
                </div>
                <div className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  Maandelijkse uitbetaling
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Features Section */}
        <section className="py-24 bg-white/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Waarom Filright Affiliate?
              </h3>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Alles wat je nodig hebt om succesvol geld te verdienen met affiliate marketing
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  icon: "🎯",
                  title: "Real-time Tracking",
                  description: "Zie direct wanneer iemand via jouw link koopt. Geen wachten op maandelijkse rapportages.",
                  color: "from-blue-500 to-cyan-500"
                },
                {
                  icon: "⚡",
                  title: "Automatische Verwerking",
                  description: "Zapier integratie zorgt voor naadloze data verwerking. Alles gebeurt automatisch.",
                  color: "from-green-500 to-emerald-500"
                },
                {
                  icon: "📊",
                  title: "Persoonlijk Dashboard",
                  description: "Overzichtelijk dashboard met al je statistieken, verdiensten en performance insights.",
                  color: "from-purple-500 to-pink-500"
                },
                {
                  icon: "💳",
                  title: "Snelle Uitbetalingen",
                  description: "Maandelijkse automatische uitbetalingen direct naar je bankrekening.",
                  color: "from-orange-500 to-red-500"
                },
                {
                  icon: "📱",
                  title: "Social Media Ready",
                  description: "Optimaal voor Instagram, TikTok, YouTube en andere platforms. Share & earn!",
                  color: "from-indigo-500 to-purple-500"
                },
                {
                  icon: "🎁",
                  title: "Bonus Programma",
                  description: "Extra bonussen bij het behalen van maandelijkse targets. Meer verkopen = meer verdienen!",
                  color: "from-yellow-500 to-orange-500"
                }
              ].map((feature, index) => (
                <div
                  key={index}
                  className={`group bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer ${hoveredFeature === index ? 'scale-105' : ''}`}
                  onMouseEnter={() => setHoveredFeature(index)}
                  onMouseLeave={() => setHoveredFeature(null)}
                >
                  <div className={`w-16 h-16 bg-gradient-to-r ${feature.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    <span className="text-white text-2xl">{feature.icon}</span>
                  </div>
                  <h4 className="text-xl font-bold text-gray-900 mb-4 group-hover:text-indigo-600 transition-colors">
                    {feature.title}
                  </h4>
                  <p className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it Works */}
        <section className="py-24 bg-gradient-to-r from-indigo-50 to-purple-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Zo Simpel Werkt Het
              </h3>
              <p className="text-xl text-gray-600">
                In 4 stappen van aanmelding naar je eerste verdiensten
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                {
                  step: "1",
                  title: "Aanmelden",
                  description: "Gratis account aanmaken en je unieke referral link ontvangen",
                  icon: "👤"
                },
                {
                  step: "2", 
                  title: "Delen",
                  description: "Je persoonlijke link delen op social media, blog of website",
                  icon: "📲"
                },
                {
                  step: "3",
                  title: "Tracking",
                  description: "Automatische tracking van alle verkopen via jouw link (30 dagen cookie)",
                  icon: "📈"
                },
                {
                  step: "4",
                  title: "Verdienen",
                  description: "Maandelijkse uitbetaling van je commissies direct naar je bank",
                  icon: "💰"
                }
              ].map((step, index) => (
                <div key={index} className="text-center group">
                  <div className="relative mb-6">
                    <div className="w-20 h-20 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                      <span className="text-white text-3xl font-bold">{step.step}</span>
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md">
                      <span className="text-lg">{step.icon}</span>
                    </div>
                  </div>
                  <h4 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-indigo-600 transition-colors">
                    {step.title}
                  </h4>
                  <p className="text-gray-600 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Social Proof / Stats */}
        <section className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Join de Groeiende Community
              </h3>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {[
                { number: "2+", label: "Actieve Influencers", icon: "👥" },
                { number: "€2.6K+", label: "Totaal Uitgekeerd", icon: "💳" },
                { number: "4+", label: "Succesvolle Orders", icon: "📦" },
                { number: "7%", label: "Max Commissie", icon: "📈" }
              ].map((stat, index) => (
                <div key={index} className="text-center group">
                  <div className="w-16 h-16 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                    <span className="text-2xl">{stat.icon}</span>
                  </div>
                  <div className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                    {stat.number}
                  </div>
                  <div className="text-gray-600 font-medium">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-24 bg-gradient-to-r from-indigo-600 to-purple-600">
          <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
            <h3 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Klaar om te Starten?
            </h3>
            <p className="text-xl text-indigo-100 mb-8 leading-relaxed">
              Sluit je aan bij succesvolle influencers die al verdienen met Filright. 
              Geen verborgen kosten, geen minimum verkopen vereist.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
              <Link
                href="/dashboard/login"
                className="group px-8 py-4 bg-white text-indigo-600 rounded-full hover:bg-gray-50 transition-all duration-200 font-bold shadow-xl hover:shadow-2xl transform hover:-translate-y-1 text-lg"
              >
                🚀 Gratis Starten
                <span className="ml-2 group-hover:translate-x-1 transition-transform duration-200">→</span>
              </Link>
              <div className="text-indigo-100 text-sm">
                ✓ Geen setup kosten • ✓ Direct beginnen • ✓ 24/7 support
              </div>
            </div>

            <div className="inline-flex items-center px-4 py-2 bg-white/10 backdrop-blur-sm text-white rounded-full text-sm">
              <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
              System Status: Live & Tracking
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-gray-900 text-white">
          <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              {/* Brand */}
              <div className="col-span-1 md:col-span-2">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-xl">F</span>
                  </div>
                  <div>
                    <h4 className="text-xl font-bold">Filright Affiliate</h4>
                    <p className="text-gray-400 text-sm">Verdien met jouw invloed</p>
                  </div>
                </div>
                <p className="text-gray-400 mb-4 max-w-md">
                  Het meest betrouwbare affiliate platform voor influencers. 
                  Real-time tracking, automatische uitbetalingen en persoonlijke support.
                </p>
              </div>

              {/* Quick Links */}
              <div>
                <h5 className="font-semibold mb-4">Platform</h5>
                <ul className="space-y-2 text-gray-400">
                  <li><Link href="/dashboard/login" className="hover:text-white transition-colors">Dashboard</Link></li>
                  <li><Link href="/admin/login" className="hover:text-white transition-colors">Admin Login</Link></li>
                  <li><a href="#" className="hover:text-white transition-colors">API Status</a></li>
                </ul>
              </div>

              {/* Support */}
              <div>
                <h5 className="font-semibold mb-4">Support</h5>
                <ul className="space-y-2 text-gray-400">
                  <li><a href="mailto:support@filright.com" className="hover:text-white transition-colors">Contact</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Terms & Privacy</a></li>
                </ul>
              </div>
            </div>

            <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
              <p className="text-gray-400 text-sm">
                © 2025 Filright Affiliate System. Alle rechten voorbehouden.
              </p>
              <div className="flex items-center space-x-4 mt-4 md:mt-0 text-sm text-gray-400">
                <span>Powered by</span>
                <span className="text-white">Next.js • Vercel • PostgreSQL</span>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
} 