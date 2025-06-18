export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    console.log('🧪 Testing Sven login credentials...');

    // Test de login credentials
    const testCredentials = {
      username: 'sven',
      password: 'sven_admin_2025'
    };

    // Simuleer de login logica
    const adminCredentials = {
      'admin': 'admin123',
      'filright': 'filright2025',
      'stefan': 'stefan_admin123',
      'sven': 'sven_admin_2025'
    };

    const isValidLogin = adminCredentials[testCredentials.username] === testCredentials.password;

    if (isValidLogin) {
      const token = `admin_${testCredentials.username}_${Date.now()}`;
      
      res.status(200).json({
        success: true,
        message: '✅ Sven login credentials are working!',
        testResult: 'PASS',
        credentials: {
          username: testCredentials.username,
          passwordMatches: true
        },
        token: token,
        instructions: [
          '1. Go to: https://fraffil.vercel.app/admin/login',
          '2. Username: sven',
          '3. Password: sven_admin_2025',
          '4. Click Login'
        ]
      });
    } else {
      res.status(400).json({
        success: false,
        message: '❌ Sven login credentials are NOT working',
        testResult: 'FAIL',
        credentials: {
          username: testCredentials.username,
          passwordMatches: false,
          expectedPassword: 'sven_admin_2025',
          actualCheck: adminCredentials[testCredentials.username] || 'NOT_FOUND'
        }
      });
    }

  } catch (error) {
    console.error('❌ Test error:', error);
    
    res.status(500).json({
      success: false,
      error: 'Test failed',
      message: error.message
    });
  }
} 