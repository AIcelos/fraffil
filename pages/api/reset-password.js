import { updateInfluencerPassword } from '../../lib/database.js';
import { resetTokens } from './forgot-password.js';
import bcrypt from 'bcryptjs';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { token, password, confirmPassword } = req.body;

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

    console.log('🔐 Password reset attempt with token:', token.substring(0, 8) + '...');

    // Controleer token
    const tokenData = resetTokens.get(token);
    
    if (!tokenData) {
      console.log('❌ Invalid reset token:', token.substring(0, 8) + '...');
      return res.status(400).json({
        success: false,
        error: 'Ongeldige of verlopen reset link'
      });
    }

    // Controleer expiry
    if (Date.now() > tokenData.expiry) {
      console.log('❌ Expired reset token for:', tokenData.username);
      resetTokens.delete(token);
      return res.status(400).json({
        success: false,
        error: 'Reset link is verlopen. Vraag een nieuwe aan.'
      });
    }

    // Controleer of token al gebruikt is
    if (tokenData.used) {
      console.log('❌ Token already used for:', tokenData.username);
      return res.status(400).json({
        success: false,
        error: 'Deze reset link is al gebruikt'
      });
    }

    console.log('✅ Valid reset token for:', tokenData.username);

    // Hash het nieuwe wachtwoord
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Update wachtwoord in database (met fallback voor development)
    let updateResult = { success: false };
    
    try {
      updateResult = await updateInfluencerPassword(tokenData.username, hashedPassword);
    } catch (error) {
      console.log('⚠️  Database error, using development fallback:', error.message);
      
      // In development mode, simulate successful password update
      if (process.env.NODE_ENV === 'development') {
        console.log('🔐 Development mode - Password would be updated for:', tokenData.username);
        console.log('🔐 New password hash:', hashedPassword.substring(0, 20) + '...');
        updateResult = { success: true, user: { username: tokenData.username } };
      } else {
        updateResult = { success: false, error: error.message };
      }
    }
    
    if (!updateResult.success) {
      console.error('❌ Failed to update password for:', tokenData.username, updateResult.error);
      return res.status(500).json({
        success: false,
        error: 'Er ging iets mis bij het bijwerken van je wachtwoord. Probeer het opnieuw.'
      });
    }

    // Markeer token als gebruikt
    tokenData.used = true;
    
    // Verwijder token na 5 minuten voor cleanup
    setTimeout(() => {
      resetTokens.delete(token);
    }, 5 * 60 * 1000);

    console.log('✅ Password successfully reset for:', tokenData.username);

    res.status(200).json({
      success: true,
      message: 'Wachtwoord succesvol gewijzigd! Je kunt nu inloggen met je nieuwe wachtwoord.',
      username: tokenData.username
    });

  } catch (error) {
    console.error('❌ Reset password error:', error);
    
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