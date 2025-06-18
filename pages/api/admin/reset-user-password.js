import { getInfluencer, saveResetToken } from '../../../lib/database.js';
import { emailService } from '../../../lib/email.js';
import crypto from 'crypto';

// Token geldigheid: 1 uur
const TOKEN_EXPIRY = 60 * 60 * 1000;

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

    // Zoek gebruiker
    const user = await getInfluencer(userRef);
    
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

    // Sla token op in database
    const tokenSaveResult = await saveResetToken(
      resetToken,
      user.email,
      user.ref,
      user.name,
      tokenExpiry
    );

    if (!tokenSaveResult.success && !tokenSaveResult.fallback) {
      console.error('❌ Failed to save reset token');
      return res.status(500).json({
        success: false,
        error: 'Er ging iets mis bij het genereren van de reset link'
      });
    }

    // Verstuur reset email
    let emailResult = { success: false };
    
    if (process.env.RESEND_API_KEY) {
      try {
        emailResult = await emailService.sendPasswordReset(
          user.email,
          user.name,
          resetToken
        );
      } catch (error) {
        console.error('❌ Email service error:', error);
        emailResult = { success: false, error: error.message };
      }
    } else {
      console.log('⚠️  RESEND_API_KEY not configured - email not sent');
      emailResult = { success: false, error: 'Email service not configured' };
    }

    if (emailResult.success) {
      console.log('✅ Admin password reset email sent to:', user.email);
      res.status(200).json({
        success: true,
        message: `Reset link verstuurd naar ${user.email}`
      });
    } else {
      console.error('❌ Reset email failed:', emailResult.error);
      
      // In development, return the token for testing
      if (process.env.NODE_ENV === 'development') {
        console.log('🔐 Development mode - Reset token:', resetToken);
        console.log('🔗 Reset URL:', `https://fraffil.vercel.app/reset-password?token=${resetToken}`);
        
        res.status(200).json({
          success: true,
          message: `Reset link gegenereerd (check console logs)`,
          debug: {
            resetUrl: `https://fraffil.vercel.app/reset-password?token=${resetToken}`,
            email: user.email
          }
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Er ging iets mis bij het versturen van de reset email'
        });
      }
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