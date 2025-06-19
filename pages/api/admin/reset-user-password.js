import { sql } from '@vercel/postgres';
import crypto from 'crypto';

// Token geldigheid: 1 uur
const TOKEN_EXPIRY = 60 * 60 * 1000;

// Save reset token in database
async function saveResetToken(resetToken, email, userRef, userName, tokenExpiry) {
  try {
    // Create reset_tokens table if it doesn't exist
    await sql`
      CREATE TABLE IF NOT EXISTS reset_tokens (
        id SERIAL PRIMARY KEY,
        token VARCHAR(255) UNIQUE NOT NULL,
        email VARCHAR(255) NOT NULL,
        user_ref VARCHAR(100) NOT NULL,
        user_name VARCHAR(255),
        expires_at TIMESTAMP NOT NULL,
        used BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;

    // Save reset token
    const result = await sql`
      INSERT INTO reset_tokens (token, email, user_ref, user_name, expires_at)
      VALUES (${resetToken}, ${email}, ${userRef}, ${userName}, ${new Date(tokenExpiry).toISOString()})
      RETURNING id
    `;

    return { success: true, id: result.rows[0].id };
  } catch (error) {
    console.error('❌ Error saving reset token:', error);
    return { success: false, error: error.message };
  }
}

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

    // Database lookup
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

      // Check if account is active
      if (user.status !== 'active') {
        return res.status(400).json({
          success: false,
          error: 'Account is niet actief'
        });
      }

      // Generate secure reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const tokenExpiry = Date.now() + TOKEN_EXPIRY;
      console.log('🎫 Token generated for:', user.ref);

      // Save token to database
      const tokenSaveResult = await saveResetToken(
        resetToken,
        user.email,
        user.ref,
        user.name,
        tokenExpiry
      );

      if (!tokenSaveResult.success) {
        console.error('❌ Failed to save reset token:', tokenSaveResult.error);
        return res.status(500).json({
          success: false,
          error: 'Er ging iets mis bij het genereren van de reset link: ' + tokenSaveResult.error
        });
      }

      console.log('💾 Token saved successfully with ID:', tokenSaveResult.id);

      const resetUrl = `https://fraffil.vercel.app/reset-password?token=${resetToken}`;
      console.log('🔗 Reset URL generated:', resetUrl);

      // For now, always return debug info (no email service)
      res.status(200).json({
        success: true,
        message: `Reset link gegenereerd voor ${user.email}`,
        debug: {
          resetUrl: resetUrl,
          email: user.email,
          tokenId: tokenSaveResult.id,
          note: 'Token opgeslagen in database - email service tijdelijk uitgeschakeld'
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