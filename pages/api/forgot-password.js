import { getInfluencerByEmail, saveResetToken, cleanupExpiredTokens } from '../../lib/database.js';
import { emailService } from '../../lib/email.js';
import crypto from 'crypto';

// In-memory fallback voor development (alleen als database niet beschikbaar is)
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

    // Cleanup oude tokens
    await cleanupExpiredTokens();

    // Zoek gebruiker in database (met fallback voor development)
    let influencer = null;
    
    try {
      influencer = await getInfluencerByEmail(email.toLowerCase());
    } catch (error) {
      console.log('⚠️  Database error, checking for test users:', error.message);
      
      // Fallback test users voor development
      const testUsers = {
        'test@example.com': {
          email: 'test@example.com',
          username: 'testuser',
          ref: 'testuser',
          name: 'Test User',
          status: 'active'
        },
        'finaltest@example.com': {
          email: 'finaltest@example.com', 
          username: 'finaltest',
          ref: 'finaltest',
          name: 'Final Test',
          status: 'active'
        }
      };
      
      influencer = testUsers[email.toLowerCase()] || null;
    }
    
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

    console.log('🎫 Generated reset token for:', influencer.username || influencer.ref);

    // Sla token op in database (met fallback naar in-memory voor development)
    const tokenSaveResult = await saveResetToken(
      resetToken,
      influencer.email,
      influencer.username || influencer.ref,
      influencer.name,
      tokenExpiry
    );

    // Als database niet beschikbaar is, gebruik in-memory fallback
    if (!tokenSaveResult.success && !tokenSaveResult.fallback) {
      console.log('⚠️  Database token save failed, using in-memory fallback');
      resetTokens.set(resetToken, {
        email: influencer.email,
        username: influencer.username || influencer.ref,
        name: influencer.name,
        expiry: tokenExpiry,
        used: false
      });
    } else if (tokenSaveResult.fallback) {
      // Development mode - gebruik in-memory
      resetTokens.set(resetToken, {
        email: influencer.email,
        username: influencer.username || influencer.ref,
        name: influencer.name,
        expiry: tokenExpiry,
        used: false
      });
    }

    // Verstuur reset email (met fallback voor development)
    let emailResult = { success: false };
    
    if (process.env.RESEND_API_KEY) {
      try {
        emailResult = await emailService.sendPasswordReset(
          influencer.email,
          influencer.name,
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

    if (!emailResult.success) {
      console.error('❌ Reset email failed:', emailResult.error);
      
      // In development, still return success but log the token
      if (process.env.NODE_ENV === 'development') {
        console.log('🔐 Development mode - Reset token:', resetToken);
        console.log('🔗 Reset URL:', `http://localhost:3000/reset-password?token=${resetToken}`);
      }
    } else {
      console.log('✅ Password reset email sent to:', email);
    }

    // Cleanup oude in-memory tokens (als we die gebruiken)
    const now = Date.now();
    for (const [token, data] of resetTokens.entries()) {
      if (data.expiry < now) {
        resetTokens.delete(token);
      }
    }

    res.status(200).json({
      success: true,
      message: emailResult.success 
        ? 'Als dit email adres bestaat, hebben we een reset link verstuurd. Check je inbox!'
        : 'Als dit email adres bestaat, hebben we een reset link verstuurd. Check de console voor de reset URL.',
      debug: process.env.NODE_ENV === 'development' ? {
        token: resetToken,
        expiry: new Date(tokenExpiry).toISOString(),
        resetUrl: `http://localhost:3000/reset-password?token=${resetToken}`,
        emailSent: emailResult.success,
        tokenStorage: tokenSaveResult.fallback ? 'in-memory' : 'database'
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

// Export reset tokens voor gebruik in reset-password API (fallback)
export { resetTokens }; 