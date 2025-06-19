import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  try {
    console.log('🔍 Checking finaltest data...');

    // Check database for finaltest
    const result = await sql`
      SELECT ref, name, email, commission, status, created_at, updated_at
      FROM influencers 
      WHERE ref = 'finaltest'
      LIMIT 1
    `;

    const user = result.rows[0];
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'finaltest not found in database',
        found: false
      });
    }

    // Check what init script says
    const initScriptCommission = 12.5; // From scripts/init-database.js
    
    const analysis = {
      database: {
        ref: user.ref,
        name: user.name,
        email: user.email,
        commission: user.commission,
        status: user.status,
        created_at: user.created_at,
        updated_at: user.updated_at
      },
      expected: {
        commission: initScriptCommission
      },
      discrepancy: {
        exists: user.commission !== initScriptCommission,
        dbValue: user.commission,
        expectedValue: initScriptCommission,
        difference: initScriptCommission - user.commission
      }
    };

    console.log('📊 finaltest analysis:', analysis);

    return res.status(200).json({
      success: true,
      found: true,
      analysis,
      message: `finaltest commission: ${user.commission}% (expected: ${initScriptCommission}%)`
    });

  } catch (error) {
    console.error('❌ Error checking finaltest:', error);
    
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
} 