import { sql } from '@vercel/postgres';
import crypto from 'crypto';

// Token geldigheid: 1 uur
const TOKEN_EXPIRY = 60 * 60 * 1000;

// Dynamic import van email service om runtime errors te voorkomen
let emailService = null;
async function getEmailService() {
  if (!emailService) {
    try {
      const emailModule = await import('../../../lib/email.js');
      emailService = emailModule.emailService || emailModule.default;
    } catch (error) {
      console.error('❌ Failed to load email service:', error);
      emailService = false; // Mark as failed
    }
  }
  return emailService === false ? null : emailService;
}

// Database functions using ES6 and @vercel/postgres
async function getInfluencerByRef(ref) {
  try {
    const result = await sql`
      SELECT ref, name, email, status
      FROM influencers 
      WHERE ref = ${ref}
      LIMIT 1
    `;
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error fetching influencer:', error);
    return null;
  }
}

async function saveResetTokenDB(resetToken, email, userRef, userName, tokenExpiry) {
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
    console.error('Error saving reset token:', error);
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

    // Zoek gebruiker in Neon database
    let user;
    try {
      user = await getInfluencerByRef(userRef);
      console.log('👤 User lookup result:', user ? 'Found' : 'Not found');
    } catch (dbError) {
      console.error('❌ Database error during user lookup:', dbError);
      return res.status(500).json({
        success: false,
        error: 'Database error tijdens gebruiker lookup'
      });
    }
    
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

    // Check of account actief is
    if (user.status !== 'active') {
      return res.status(400).json({
        success: false,
        error: 'Account is niet actief'
      });
    }

    // Genereer veilige reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const tokenExpiry = Date.now() + TOKEN_EXPIRY;

    console.log('🎫 Generated admin reset token for:', user.ref);

    // Sla token op in Neon database
    let tokenSaveResult;
    try {
      tokenSaveResult = await saveResetTokenDB(
        resetToken,
        user.email,
        user.ref,
        user.name,
        tokenExpiry
      );
      console.log('💾 Token save result:', tokenSaveResult.success ? 'Success' : 'Failed');
    } catch (tokenError) {
      console.error('❌ Token save error:', tokenError);
      return res.status(500).json({
        success: false,
        error: 'Database error tijdens token opslaan'
      });
    }

    if (!tokenSaveResult.success) {
      console.error('❌ Failed to save reset token:', tokenSaveResult.error);
      return res.status(500).json({
        success: false,
        error: 'Er ging iets mis bij het genereren van de reset link'
      });
    }

    // Verstuur reset email met dynamic import
    console.log('✅ Reset token saved successfully for:', user.email);
    
    let emailResult = { success: false };
    const emailSvc = await getEmailService();
    
    if (emailSvc && process.env.RESEND_API_KEY) {
      try {
        emailResult = await emailSvc.sendPasswordReset(
          user.email,
          user.name,
          resetToken
        );
        console.log('📧 Email service result:', emailResult.success ? 'Success' : 'Failed');
      } catch (error) {
        console.error('❌ Email service error:', error);
        emailResult = { success: false, error: error.message };
      }
    } else {
      console.log('⚠️ Email service not available or RESEND_API_KEY not configured');
      emailResult = { success: false, error: 'Email service not configured' };
    }

    // Development mode - altijd debug info tonen
    const resetUrl = `https://fraffil.vercel.app/reset-password?token=${resetToken}`;
    console.log('🔗 Reset URL:', resetUrl);

    if (emailResult.success) {
      console.log('✅ Admin password reset email sent to:', user.email);
      res.status(200).json({
        success: true,
        message: `Reset link verstuurd naar ${user.email}`
      });
    } else {
      console.error('❌ Reset email failed:', emailResult.error);
      
      // Altijd debug info tonen als email faalt
      res.status(200).json({
        success: true,
        message: `Reset link gegenereerd voor ${user.email} (email niet verstuurd)`,
        debug: {
          resetUrl: resetUrl,
          email: user.email,
          tokenId: tokenSaveResult.id,
          emailError: emailResult.error
        }
      });
    }

  } catch (error) {
    console.error('❌ Admin reset password error:', error);
    
    res.status(500).json({
      success: false,
      error: 'Server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
} 