import { sql } from '@vercel/postgres';
import crypto from 'crypto';
import { emailService } from '../../../lib/email.js';

// Token geldigheid: 1 uur
const TOKEN_EXPIRY = 60 * 60 * 1000;

// Create table if not exists
async function ensureResetTokensTable() {
  try {
    console.log('🔧 Ensuring reset_tokens table exists...');
    await sql`
      CREATE TABLE IF NOT EXISTS reset_tokens (
        id SERIAL PRIMARY KEY,
        token VARCHAR(255) UNIQUE NOT NULL,
        email VARCHAR(255) NOT NULL,
        userref VARCHAR(100) NOT NULL,
        username VARCHAR(255),
        expires_at TIMESTAMP NOT NULL,
        used BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;
    console.log('✅ Table ensured');
    return { success: true };
  } catch (error) {
    console.error('❌ Table creation error:', error);
    return { success: false, error: error.message };
  }
}

// Save reset token in database
async function saveResetToken(resetToken, email, userRef, userName, tokenExpiry) {
  try {
    console.log('💾 Saving reset token for:', { email, userRef, userName });
    
    const result = await sql`
      INSERT INTO reset_tokens (token, email, userref, username, expires_at)
      VALUES (${resetToken}, ${email}, ${userRef}, ${userName || ''}, ${new Date(tokenExpiry).toISOString()})
      RETURNING id
    `;
    
    console.log('✅ Token saved with ID:', result.rows[0].id);
    return { success: true, id: result.rows[0].id };
    
  } catch (error) {
    console.error('❌ Error saving token:', error);
    console.error('❌ Error details:', {
      message: error.message,
      code: error.code,
      detail: error.detail
    });
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
    console.log('🔐 Reset password request for:', userRef);

    if (!userRef) {
      return res.status(400).json({
        success: false,
        error: 'Gebruiker referentie is verplicht'
      });
    }

    // Step 1: Ensure table exists
    const tableResult = await ensureResetTokensTable();
    if (!tableResult.success) {
      return res.status(500).json({
        success: false,
        error: 'Database setup failed: ' + tableResult.error
      });
    }

    // Step 2: Database lookup
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

    if (user.status !== 'active') {
      return res.status(400).json({
        success: false,
        error: 'Account is niet actief'
      });
    }

    // Step 3: Generate token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const tokenExpiry = Date.now() + TOKEN_EXPIRY;
    console.log('🎫 Token generated');

    // Step 4: Save token
    const tokenSaveResult = await saveResetToken(
      resetToken,
      user.email,
      user.ref,
      user.name,
      tokenExpiry
    );

    if (!tokenSaveResult.success) {
      console.error('❌ Failed to save token:', tokenSaveResult.error);
      return res.status(500).json({
        success: false,
        error: 'Token opslag gefaald: ' + tokenSaveResult.error
      });
    }

    console.log('✅ Token saved successfully with ID:', tokenSaveResult.id);

    // Step 5: Send email via Resend
    try {
      console.log('📧 Sending password reset email to:', user.email);
      
      const emailResult = await emailService.sendPasswordReset(
        user.email,
        user.name || user.ref,
        resetToken
      );

      if (!emailResult.success) {
        console.error('❌ Email sending failed:', emailResult.error);
        // Email failed, but token is saved, so we can still return success with debug info
        return res.status(200).json({
          success: true,
          message: `Reset token gegenereerd voor ${user.email}`,
          warning: 'Email kon niet worden verzonden',
          emailError: emailResult.error,
          debug: {
            resetUrl: `https://affiliate.filright.com/reset-password?token=${resetToken}`,
            email: user.email,
            tokenId: tokenSaveResult.id,
            note: 'Token opgeslagen - email verzending gefaald'
          }
        });
      }

      console.log('✅ Password reset email sent successfully!', emailResult.messageId);

      // Everything successful
      res.status(200).json({
        success: true,
        message: `Reset email verzonden naar ${user.email}`,
        emailSent: true,
        emailId: emailResult.messageId,
        debug: {
          resetUrl: `https://affiliate.filright.com/reset-password?token=${resetToken}`,
          email: user.email,
          tokenId: tokenSaveResult.id,
          note: 'Email succesvol verzonden via Resend'
        }
      });

    } catch (emailError) {
      console.error('❌ Email service error:', emailError);
      
      // Email failed, but token is saved
      res.status(200).json({
        success: true,
        message: `Reset token gegenereerd voor ${user.email}`,
        warning: 'Email service tijdelijk niet beschikbaar',
        emailError: emailError.message,
        debug: {
          resetUrl: `https://affiliate.filright.com/reset-password?token=${resetToken}`,
          email: user.email,
          tokenId: tokenSaveResult.id,
          note: 'Token opgeslagen - email service error'
        }
      });
    }

  } catch (error) {
    console.error('❌ General error:', error);
    console.error('❌ Error stack:', error.stack);
    
    res.status(500).json({
      success: false,
      error: 'Server error: ' + error.message,
      debug: error.stack
    });
  }
} 