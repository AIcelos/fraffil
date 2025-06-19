function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    console.log('🔍 Simple test API - Starting...');
    
    const response = {
      success: true,
      message: 'Simple API works!',
      environment: {
        nodeEnv: process.env.NODE_ENV,
        hasPostgresUrl: !!process.env.POSTGRES_URL,
        timestamp: new Date().toISOString()
      }
    };

    console.log('✅ Simple test response:', response);
    res.status(200).json(response);

  } catch (error) {
    console.error('❌ Simple test error:', error);
    
    res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
}

module.exports = handler; 