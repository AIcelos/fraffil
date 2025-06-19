import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  try {
    console.log('🔧 Fixing finaltest commission...');

    // First, check current commission
    const currentResult = await sql`
      SELECT ref, name, email, commission, status
      FROM influencers 
      WHERE ref = 'finaltest'
      LIMIT 1
    `;

    const currentUser = currentResult.rows[0];
    
    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: 'finaltest not found in database'
      });
    }

    console.log('📊 Current finaltest data:', currentUser);

    // Update commission to correct value from init script
    const correctCommission = 12.5; // From scripts/init-database.js
    
    const updateResult = await sql`
      UPDATE influencers 
      SET commission = ${correctCommission},
          updated_at = NOW()
      WHERE ref = 'finaltest'
      RETURNING ref, name, email, commission, status, updated_at
    `;

    const updatedUser = updateResult.rows[0];
    
    console.log('✅ Updated finaltest commission:', updatedUser);

    // Verify the update
    const verifyResult = await sql`
      SELECT ref, name, email, commission, status, updated_at
      FROM influencers 
      WHERE ref = 'finaltest'
      LIMIT 1
    `;

    const verifiedUser = verifyResult.rows[0];

    return res.status(200).json({
      success: true,
      message: 'finaltest commission updated successfully',
      before: {
        commission: currentUser.commission
      },
      after: {
        commission: verifiedUser.commission,
        updated_at: verifiedUser.updated_at
      },
      change: {
        from: currentUser.commission,
        to: verifiedUser.commission,
        difference: verifiedUser.commission - currentUser.commission
      }
    });

  } catch (error) {
    console.error('❌ Error fixing finaltest commission:', error);
    
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
} 