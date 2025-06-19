function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check environment variables
    const dbUrl = process.env.POSTGRES_URL;
    const nodeEnv = process.env.NODE_ENV;
    const vercelEnv = process.env.VERCEL_ENV;
    
    console.log('🔍 Database test check:');
    console.log('  - NODE_ENV:', nodeEnv);
    console.log('  - VERCEL_ENV:', vercelEnv);
    console.log('  - POSTGRES_URL exists:', !!dbUrl);
    console.log('  - POSTGRES_URL length:', dbUrl ? dbUrl.length : 0);
    
    // Check all postgres-related env vars
    const postgresKeys = Object.keys(process.env).filter(key => 
      key.toLowerCase().includes('postgres') || 
      key.toLowerCase().includes('database') ||
      key.toLowerCase().includes('db_')
    );
    
    const response = {
      success: true,
      environment: {
        NODE_ENV: nodeEnv,
        VERCEL_ENV: vercelEnv,
        hasPostgresUrl: !!dbUrl,
        postgresUrlLength: dbUrl ? dbUrl.length : 0,
        allDbKeys: postgresKeys,
        timestamp: new Date().toISOString()
      },
      message: 'Database test completed - check logs for details'
    };

    console.log('✅ Test response:', response);

    res.status(200).json(response);

  } catch (error) {
    console.error('❌ Test error:', error);
    
    res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
  }
}

module.exports = handler; 