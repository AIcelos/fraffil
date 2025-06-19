import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userRef } = req.body;
    console.log('🧪 Test Reset - Input:', { userRef });

    // Step 1: Test database connection
    const testResult = await sql`SELECT 1 as test`;
    console.log('✅ Database connection OK');

    // Step 2: Test user lookup
    if (userRef) {
      const userResult = await sql`
        SELECT ref, name, email, status
        FROM influencers 
        WHERE ref = ${userRef}
        LIMIT 1
      `;
      console.log('👤 User lookup result:', userResult.rows[0]);
      
      return res.status(200).json({
        success: true,
        message: 'Test completed',
        data: {
          dbConnection: true,
          user: userResult.rows[0] || null,
          userRef: userRef
        }
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Basic test completed',
      data: {
        dbConnection: true,
        userRef: userRef || 'not provided'
      }
    });

  } catch (error) {
    console.error('❌ Test error:', error);
    
    return res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
} 