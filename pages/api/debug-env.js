export default async function handler(req, res) {
  console.log('🔍 Environment Debug API called');
  
  const debugInfo = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    vercelEnv: process.env.VERCEL_ENV,
    postgresUrl: {
      exists: !!process.env.POSTGRES_URL,
      length: process.env.POSTGRES_URL ? process.env.POSTGRES_URL.length : 0,
      prefix: process.env.POSTGRES_URL ? process.env.POSTGRES_URL.substring(0, 20) + '...' : 'NOT_SET'
    },
    allEnvKeys: Object.keys(process.env).filter(key => 
      key.includes('POSTGRES') || 
      key.includes('DATABASE') || 
      key.includes('DB_') ||
      key.includes('VERCEL')
    ).sort(),
    processInfo: {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch
    }
  };

  console.log('🔍 Debug info:', JSON.stringify(debugInfo, null, 2));

  // Test database import
  let dbImportTest = null;
  try {
    const { sql } = await import('@vercel/postgres');
    dbImportTest = { success: true, message: '@vercel/postgres imported successfully' };
    
    // Test simple query if POSTGRES_URL exists
    if (process.env.POSTGRES_URL) {
      try {
        const result = await sql`SELECT 1 as test`;
        dbImportTest.queryTest = { success: true, result: result.rows };
      } catch (queryError) {
        dbImportTest.queryTest = { 
          success: false, 
          error: queryError.message,
          code: queryError.code 
        };
      }
    }
  } catch (importError) {
    dbImportTest = { 
      success: false, 
      error: importError.message 
    };
  }

  const response = {
    ...debugInfo,
    databaseTest: dbImportTest
  };

  res.status(200).json(response);
} 