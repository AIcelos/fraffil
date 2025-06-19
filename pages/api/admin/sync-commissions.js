import { sql } from '@vercel/postgres';

// Expected commission rates (from init script and business requirements)
const EXPECTED_COMMISSIONS = {
  'finaltest': 12.5,  // High performing influencer
  'testuser': 10.0,   // Standard rate
  'annemieke': 8.0,   // Existing influencer rate
  'sven': 15.0,       // Admin/founder rate
  // Add more as needed
};

const DEFAULT_COMMISSION = 6.0; // Default for new users

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🔄 Starting commission synchronization...');

    // Get all current users
    const currentUsers = await sql`
      SELECT ref, name, email, commission, status
      FROM influencers 
      ORDER BY ref
    `;

    console.log(`📊 Found ${currentUsers.rows.length} users in database`);

    const syncResults = [];
    let updatedCount = 0;

    // Process each user
    for (const user of currentUsers.rows) {
      const expectedCommission = EXPECTED_COMMISSIONS[user.ref] || DEFAULT_COMMISSION;
      const currentCommission = parseFloat(user.commission) || 0;
      
      const needsUpdate = Math.abs(currentCommission - expectedCommission) > 0.01; // Account for floating point precision
      
      if (needsUpdate) {
        console.log(`🔧 Updating ${user.ref}: ${currentCommission}% → ${expectedCommission}%`);
        
        // Update commission
        const updateResult = await sql`
          UPDATE influencers 
          SET commission = ${expectedCommission},
              updated_at = NOW()
          WHERE ref = ${user.ref}
          RETURNING ref, commission, updated_at
        `;

        const updated = updateResult.rows[0];
        updatedCount++;

        syncResults.push({
          ref: user.ref,
          name: user.name,
          status: 'updated',
          before: currentCommission,
          after: parseFloat(updated.commission),
          difference: expectedCommission - currentCommission,
          updated_at: updated.updated_at
        });
      } else {
        syncResults.push({
          ref: user.ref,
          name: user.name,
          status: 'no_change',
          commission: currentCommission,
          expected: expectedCommission
        });
      }
    }

    // Summary
    const summary = {
      totalUsers: currentUsers.rows.length,
      updatedUsers: updatedCount,
      noChangeUsers: currentUsers.rows.length - updatedCount,
      expectedCommissions: EXPECTED_COMMISSIONS,
      defaultCommission: DEFAULT_COMMISSION
    };

    console.log('✅ Commission sync completed:', summary);

    return res.status(200).json({
      success: true,
      message: `Commission sync completed: ${updatedCount} users updated`,
      summary,
      results: syncResults,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Commission sync error:', error);
    
    return res.status(500).json({
      success: false,
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
} 