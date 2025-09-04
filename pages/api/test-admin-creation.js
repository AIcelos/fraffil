export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Test of de createAdminUser functie kan worden geïmporteerd
    const { createAdminUser } = await import('../../lib/database.js');
    
    if (req.method === 'GET') {
      res.status(200).json({
        success: true,
        message: 'Test API is working',
        method: req.method,
        canImportFunction: typeof createAdminUser === 'function'
      });
    } else if (req.method === 'POST') {
      // Maak de admin gebruiker aan
      console.log('🚀 Test: Creating admin user for sven@filright.com...');
      
      const result = await createAdminUser({
        email: 'sven@filright.com',
        username: 'sven',
        password: 'temp123456',
        role: 'admin'
      });

      res.status(result.success ? 201 : 400).json({
        success: result.success,
        message: result.success ? 'Admin user created successfully!' : 'Failed to create admin user',
        error: result.error || null,
        data: result.data || null,
        nextSteps: result.success ? [
          'Go to: https://affiliate.filright.com/forgot-password',
          'Enter email: sven@filright.com',
          'Check your email for reset link',
          'Set your new password',
          'Login at: https://affiliate.filright.com/admin/login'
        ] : null
      });
    } else {
      res.status(405).json({
        success: false,
        error: 'Method not allowed',
        allowedMethods: ['GET', 'POST']
      });
    }

  } catch (error) {
    console.error('❌ Test API error:', error);
    
    res.status(500).json({
      success: false,
      error: 'Server error',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
} 