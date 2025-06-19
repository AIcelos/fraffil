function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    console.log('🔍 Debug API - Starting...');
    
    // Check environment
    const dbUrl = process.env.POSTGRES_URL;
    const nodeEnv = process.env.NODE_ENV;
    
    console.log('Environment check:', {
      hasPostgresUrl: !!dbUrl,
      nodeEnv: nodeEnv,
      urlLength: dbUrl ? dbUrl.length : 0
    });

    // Try to import @vercel/postgres
    let sqlModule = null;
    let importError = null;
    
    try {
      console.log('Attempting to import @vercel/postgres...');
      sqlModule = require('@vercel/postgres');
      console.log('✅ @vercel/postgres imported successfully');
    } catch (error) {
      console.error('❌ Failed to import @vercel/postgres:', error);
      importError = error.message;
    }

    // Try to access sql
    let sqlFunction = null;
    let sqlError = null;
    
    if (sqlModule) {
      try {
        sqlFunction = sqlModule.sql;
        console.log('✅ sql function accessed:', typeof sqlFunction);
      } catch (error) {
        console.error('❌ Failed to access sql function:', error);
        sqlError = error.message;
      }
    }

    const response = {
      success: true,
      debug: {
        environment: {
          hasPostgresUrl: !!dbUrl,
          nodeEnv: nodeEnv,
          urlLength: dbUrl ? dbUrl.length : 0
        },
        imports: {
          vercelPostgresModule: !!sqlModule,
          importError: importError,
          sqlFunction: !!sqlFunction,
          sqlError: sqlError
        },
        timestamp: new Date().toISOString()
      },
      message: 'Debug completed - check console logs'
    };

    console.log('✅ Debug response:', response);
    res.status(200).json(response);

  } catch (error) {
    console.error('❌ Debug API error:', error);
    
    res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
  }
}

module.exports = handler; 