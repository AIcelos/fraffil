import { sql } from '@vercel/postgres';
import { getInfluencer, getAllInfluencers } from '../../lib/database.js';

export default async function handler(req, res) {
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

  const debugResults = {
    timestamp: new Date().toISOString(),
    tests: []
  };

  try {
    // Test 1: Direct SQL connection
    debugResults.tests.push({
      name: 'Direct SQL Connection',
      status: 'running'
    });
    
    try {
      const directResult = await sql`SELECT NOW() as current_time`;
      debugResults.tests[debugResults.tests.length - 1] = {
        name: 'Direct SQL Connection',
        status: 'success',
        result: directResult.rows[0]
      };
    } catch (error) {
      debugResults.tests[debugResults.tests.length - 1] = {
        name: 'Direct SQL Connection',
        status: 'error',
        error: error.message
      };
    }

    // Test 2: Check if influencers table exists
    debugResults.tests.push({
      name: 'Check Influencers Table',
      status: 'running'
    });
    
    try {
      const tableResult = await sql`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'influencers'
      `;
      debugResults.tests[debugResults.tests.length - 1] = {
        name: 'Check Influencers Table',
        status: 'success',
        result: {
          columns: tableResult.rows,
          count: tableResult.rows.length
        }
      };
    } catch (error) {
      debugResults.tests[debugResults.tests.length - 1] = {
        name: 'Check Influencers Table',
        status: 'error',
        error: error.message
      };
    }

    // Test 3: Direct query for finaltest
    debugResults.tests.push({
      name: 'Direct Query for finaltest',
      status: 'running'
    });
    
    try {
      const finaltestResult = await sql`
        SELECT * FROM influencers WHERE ref = 'finaltest'
      `;
      debugResults.tests[debugResults.tests.length - 1] = {
        name: 'Direct Query for finaltest',
        status: 'success',
        result: {
          found: finaltestResult.rows.length > 0,
          data: finaltestResult.rows[0] || null,
          rowCount: finaltestResult.rows.length
        }
      };
    } catch (error) {
      debugResults.tests[debugResults.tests.length - 1] = {
        name: 'Direct Query for finaltest',
        status: 'error',
        error: error.message
      };
    }

    // Test 4: Using getInfluencer function
    debugResults.tests.push({
      name: 'getInfluencer Function Test',
      status: 'running'
    });
    
    try {
      const functionResult = await getInfluencer('finaltest');
      debugResults.tests[debugResults.tests.length - 1] = {
        name: 'getInfluencer Function Test',
        status: 'success',
        result: {
          found: functionResult !== null,
          data: functionResult,
          commission: functionResult?.commission
        }
      };
    } catch (error) {
      debugResults.tests[debugResults.tests.length - 1] = {
        name: 'getInfluencer Function Test',
        status: 'error',
        error: error.message,
        stack: error.stack
      };
    }

    // Test 5: Get all influencers
    debugResults.tests.push({
      name: 'getAllInfluencers Function Test',
      status: 'running'
    });
    
    try {
      const allResult = await getAllInfluencers();
      debugResults.tests[debugResults.tests.length - 1] = {
        name: 'getAllInfluencers Function Test',
        status: 'success',
        result: {
          count: allResult.length,
          influencers: allResult.map(inf => ({
            ref: inf.ref,
            commission: inf.commission,
            name: inf.name
          }))
        }
      };
    } catch (error) {
      debugResults.tests[debugResults.tests.length - 1] = {
        name: 'getAllInfluencers Function Test',
        status: 'error',
        error: error.message
      };
    }

    // Summary
    const successCount = debugResults.tests.filter(t => t.status === 'success').length;
    const errorCount = debugResults.tests.filter(t => t.status === 'error').length;
    
    return res.status(200).json({
      success: errorCount === 0,
      summary: {
        total: debugResults.tests.length,
        success: successCount,
        errors: errorCount
      },
      debug: debugResults
    });
    
  } catch (error) {
    console.error('❌ Debug endpoint error:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      debug: debugResults
    });
  }
} 