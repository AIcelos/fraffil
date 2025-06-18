import { getInfluencer, getAllInfluencers } from '../../lib/database.js';

export default async function handler(req, res) {
  console.log('🧪 Database Connection Test API');
  
  const testResults = {
    timestamp: new Date().toISOString(),
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      VERCEL_ENV: process.env.VERCEL_ENV,
      hasPostgresUrl: !!process.env.POSTGRES_URL
    },
    tests: []
  };

  // Test 1: Environment variable check
  try {
    const envTest = {
      name: 'Environment Variables',
      postgresUrl: {
        exists: !!process.env.POSTGRES_URL,
        length: process.env.POSTGRES_URL ? process.env.POSTGRES_URL.length : 0
      },
      relatedKeys: Object.keys(process.env).filter(key => 
        key.toLowerCase().includes('postgres') || 
        key.toLowerCase().includes('db')
      )
    };
    testResults.tests.push({ ...envTest, success: true });
  } catch (error) {
    testResults.tests.push({
      name: 'Environment Variables',
      success: false,
      error: error.message
    });
  }

  // Test 2: Direct SQL import test
  try {
    const { sql } = await import('@vercel/postgres');
    testResults.tests.push({
      name: 'SQL Import',
      success: true,
      message: '@vercel/postgres imported successfully'
    });

    // Test 3: Simple query
    if (process.env.POSTGRES_URL) {
      try {
        const result = await sql`SELECT NOW() as current_time, 1 as test_number`;
        testResults.tests.push({
          name: 'Simple Query',
          success: true,
          result: result.rows[0]
        });
      } catch (queryError) {
        testResults.tests.push({
          name: 'Simple Query',
          success: false,
          error: queryError.message,
          code: queryError.code
        });
      }
    } else {
      testResults.tests.push({
        name: 'Simple Query',
        success: false,
        error: 'POSTGRES_URL not available'
      });
    }
  } catch (importError) {
    testResults.tests.push({
      name: 'SQL Import',
      success: false,
      error: importError.message
    });
  }

  // Test 4: Database functions
  try {
    const influencer = await getInfluencer('finaltest');
    testResults.tests.push({
      name: 'getInfluencer Function',
      success: true,
      result: influencer
    });
  } catch (dbError) {
    testResults.tests.push({
      name: 'getInfluencer Function',
      success: false,
      error: dbError.message
    });
  }

  try {
    const allInfluencers = await getAllInfluencers();
    testResults.tests.push({
      name: 'getAllInfluencers Function',
      success: true,
      count: allInfluencers.length,
      sample: allInfluencers.slice(0, 2)
    });
  } catch (dbError) {
    testResults.tests.push({
      name: 'getAllInfluencers Function',
      success: false,
      error: dbError.message
    });
  }

  res.status(200).json(testResults);
} 