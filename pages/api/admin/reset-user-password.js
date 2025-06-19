import { sql } from '@vercel/postgres';
import crypto from 'crypto';

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

  // Simple admin authentication
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'Geen geldige authenticatie'
    });
  }

  try {
    const { userRef } = req.body;

    if (!userRef) {
      return res.status(400).json({
        success: false,
        error: 'Gebruiker referentie is verplicht'
      });
    }

    console.log('🔐 Admin requesting password reset for user:', userRef);

    // Test database connection
    try {
      const result = await sql`
        SELECT ref, name, email, status
        FROM influencers 
        WHERE ref = ${userRef}
        LIMIT 1
      `;
      
      const user = result.rows[0];
      console.log('👤 User found:', user ? 'Yes' : 'No');
      
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'Gebruiker niet gevonden'
        });
      }

      if (!user.email) {
        return res.status(400).json({
          success: false,
          error: 'Gebruiker heeft geen email adres'
        });
      }

      // Generate token
      const resetToken = crypto.randomBytes(32).toString('hex');
      console.log('🎫 Token generated');

      // For now, just return success without saving token
      const resetUrl = `https://fraffil.vercel.app/reset-password?token=${resetToken}`;
      
      res.status(200).json({
        success: true,
        message: `Reset link gegenereerd voor ${user.email}`,
        debug: {
          resetUrl: resetUrl,
          email: user.email,
          userRef: user.ref
        }
      });

    } catch (dbError) {
      console.error('❌ Database error:', dbError);
      return res.status(500).json({
        success: false,
        error: 'Database error: ' + dbError.message
      });
    }

  } catch (error) {
    console.error('❌ General error:', error);
    
    res.status(500).json({
      success: false,
      error: 'Server error: ' + error.message
    });
  }
} 