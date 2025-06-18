import { getInfluencerByEmail } from '../../lib/database.js';
import { emailService } from '../../lib/email.js';
import crypto from 'crypto';

// In-memory storage voor reset tokens (in productie: gebruik database)
const resetTokens = new Map();

// Token geldigheid: 1 uur
const TOKEN_EXPIRY = 60 * 60 * 1000;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email adres is verplicht' 
      });
    }

    console.log('🔐 Password reset request for:', email);

    // Zoek gebruiker in database
    const influencer = await getInfluencerByEmail(email.toLowerCase());
    
    if (!influencer) {
      // Uit veiligheidsoverwegingen geven we geen informatie of het email bestaat
      console.log('❌ Email not found:', email);
      return res.status(200).json({
        success: true,
        message: 'Als dit email adres bestaat, hebben we een reset link verstuurd.'
      });
    }

    // Check of account actief is
    if (influencer.status !== 'active') {
      console.log('❌ Inactive account for reset:', email);
      return res.status(200).json({
        success: true,
        message: 'Als dit email adres bestaat, hebben we een reset link verstuurd.'
      });
    }

    // Genereer veilige reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const tokenExpiry = Date.now() + TOKEN_EXPIRY;

    // Sla token op (in productie: in database)
    resetTokens.set(resetToken, {
      email: influencer.email,
      username: influencer.username || influencer.ref,
      name: influencer.name,
      expiry: tokenExpiry,
      used: false
    });

    console.log('🎫 Generated reset token for:', influencer.username);

    // Verstuur reset email
    const emailResult = await emailService.sendPasswordReset(
      influencer.email,
      influencer.name,
      resetToken
    );

    if (!emailResult.success) {
      console.error('❌ Reset email failed:', emailResult.error);
      return res.status(500).json({
        success: false,
        error: 'Er ging iets mis bij het versturen van de reset email. Probeer het opnieuw.'
      });
    }

    console.log('✅ Password reset email sent to:', email);

    // Cleanup oude tokens (simpele garbage collection)
    const now = Date.now();
    for (const [token, data] of resetTokens.entries()) {
      if (data.expiry < now) {
        resetTokens.delete(token);
      }
    }

    res.status(200).json({
      success: true,
      message: 'Als dit email adres bestaat, hebben we een reset link verstuurd. Check je inbox!',
      debug: process.env.NODE_ENV === 'development' ? {
        token: resetToken,
        expiry: new Date(tokenExpiry).toISOString()
      } : undefined
    });

  } catch (error) {
    console.error('❌ Forgot password error:', error);
    
    if (error.message.includes('missing_connection_string')) {
      return res.status(500).json({
        success: false,
        error: 'Database niet geconfigureerd. Neem contact op met de beheerder.'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Er ging iets mis. Probeer het opnieuw.'
    });
  }
}

// Export reset tokens voor gebruik in reset-password API
export { resetTokens }; 