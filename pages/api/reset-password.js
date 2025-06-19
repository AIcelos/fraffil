import { sql } from '@vercel/postgres';
import bcrypt from 'bcryptjs';

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

  try {
    // Parse request body safely
    let requestData;
    try {
      requestData = req.body;
      if (typeof requestData === 'string') {
        requestData = JSON.parse(requestData);
      }
    } catch (parseError) {
      console.error('❌ JSON parse error:', parseError);
      return res.status(400).json({
        success: false,
        error: 'Ongeldige request data'
      });
    }

    const { token, password, confirmPassword } = requestData;

    console.log('🔐 Password reset attempt for token:', token ? token.substring(0, 8) + '...' : 'undefined');

    // Validatie
    if (!token || !password || !confirmPassword) {
      return res.status(400).json({
        success: false,
        error: 'Token, wachtwoord en bevestiging zijn verplicht'
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        error: 'Wachtwoorden komen niet overeen'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Wachtwoord moet minimaal 6 karakters lang zijn'
      });
    }

    // Zoek reset token in database
    const tokenResult = await sql`
      SELECT token, email, userref, username, expires_at, used
      FROM reset_tokens 
      WHERE token = ${token}
      LIMIT 1
    `;
    
    const tokenData = tokenResult.rows[0];
    console.log('🔍 Token lookup result:', tokenData ? 'Found' : 'Not found');
    
    if (!tokenData) {
      console.log('❌ Invalid reset token:', token.substring(0, 8) + '...');
      return res.status(400).json({
        success: false,
        error: 'Ongeldige of verlopen reset link'
      });
    }

    // Controleer expiry
    const now = new Date();
    const expiryDate = new Date(tokenData.expires_at);
    
    if (now > expiryDate) {
      console.log('❌ Expired reset token for:', tokenData.userref);
      
      // Markeer token als gebruikt
      await sql`
        UPDATE reset_tokens 
        SET used = TRUE 
        WHERE token = ${token}
      `;
      
      return res.status(400).json({
        success: false,
        error: 'Reset link is verlopen. Vraag een nieuwe aan.'
      });
    }

    // Controleer of token al gebruikt is
    if (tokenData.used) {
      console.log('❌ Token already used for:', tokenData.userref);
      return res.status(400).json({
        success: false,
        error: 'Deze reset link is al gebruikt'
      });
    }

    console.log('✅ Valid reset token for:', tokenData.userref);

    // Hash het nieuwe wachtwoord
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    console.log('🔐 Password hashed successfully');

    // Update wachtwoord in influencers tabel
    const updateResult = await sql`
      UPDATE influencers 
      SET password = ${hashedPassword}
      WHERE ref = ${tokenData.userref}
      RETURNING ref, name, email
    `;
    
    if (updateResult.rows.length === 0) {
      console.error('❌ Failed to update password - user not found:', tokenData.userref);
      return res.status(500).json({
        success: false,
        error: 'Gebruiker niet gevonden. Neem contact op met de beheerder.'
      });
    }

    const updatedUser = updateResult.rows[0];
    console.log('✅ Password updated for user:', updatedUser.ref);

    // Markeer token als gebruikt
    await sql`
      UPDATE reset_tokens 
      SET used = TRUE 
      WHERE token = ${token}
    `;
    console.log('✅ Reset token marked as used');

    res.status(200).json({
      success: true,
      message: 'Wachtwoord succesvol gewijzigd! Je kunt nu inloggen met je nieuwe wachtwoord.',
      user: {
        ref: updatedUser.ref,
        name: updatedUser.name,
        email: updatedUser.email
      }
    });

  } catch (error) {
    console.error('❌ Reset password error:', error);
    console.error('❌ Error stack:', error.stack);
    
    res.status(500).json({
      success: false,
      error: 'Er ging iets mis bij het wijzigen van je wachtwoord. Probeer het opnieuw.',
      debug: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
} 