import { createInfluencer } from '../../lib/database.js';
import { sendWelcomeEmail } from '../../lib/email.js';
import crypto from 'crypto';

// Generate temporary password
function generateTempPassword() {
  return crypto.randomBytes(8).toString('hex').slice(0, 12);
}

// Validate email format
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Validate username (alphanumeric, 3-20 chars)
function isValidUsername(username) {
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
  return usernameRegex.test(username);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('📝 New influencer registration request');
    
    const {
      username,
      email,
      name,
      phone,
      instagram,
      tiktok,
      youtube,
      website,
      referredBy,
      agreedToTerms
    } = req.body;

    // Validation
    const errors = [];

    if (!username || !isValidUsername(username)) {
      errors.push('Gebruikersnaam moet 3-20 karakters lang zijn en alleen letters, cijfers en _ bevatten');
    }

    if (!email || !isValidEmail(email)) {
      errors.push('Geldig email adres is verplicht');
    }

    if (!name || name.trim().length < 2) {
      errors.push('Volledige naam is verplicht (minimaal 2 karakters)');
    }

    if (!agreedToTerms) {
      errors.push('Je moet akkoord gaan met de algemene voorwaarden');
    }

    if (errors.length > 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Validatie fouten',
        errors 
      });
    }

    // Generate temporary password
    const tempPassword = generateTempPassword();
    console.log(`🔑 Generated temp password for ${username}: ${tempPassword}`);

    // Prepare influencer data
    const influencerData = {
      ref: username.toLowerCase(),
      username: username.toLowerCase(),
      email: email.toLowerCase(),
      name: name.trim(),
      phone: phone?.trim() || null,
      instagram: instagram?.trim() || null,
      tiktok: tiktok?.trim() || null,
      youtube: youtube?.trim() || null,
      website: website?.trim() || null,
      password: tempPassword, // Will be hashed in database function
      commission: 6.0, // Default commission rate
      status: 'active',
      referredBy: referredBy?.trim() || null,
      registrationDate: new Date().toISOString(),
      lastLogin: null,
      totalSales: 0,
      totalRevenue: 0.0,
      totalCommission: 0.0
    };

    console.log('👤 Creating new influencer:', {
      username: influencerData.username,
      email: influencerData.email,
      name: influencerData.name
    });

    // Create influencer in database
    const dbResult = await createInfluencer(influencerData);
    
    if (!dbResult.success) {
      if (dbResult.error.includes('already exists') || dbResult.error.includes('duplicate')) {
        return res.status(409).json({
          success: false,
          error: 'Gebruikersnaam of email bestaat al',
          field: dbResult.error.includes('username') ? 'username' : 'email'
        });
      }
      
      throw new Error(dbResult.error);
    }

    console.log('✅ Influencer created in database');

    // Send welcome email
    const emailData = {
      email: influencerData.email,
      name: influencerData.name,
      username: influencerData.username,
      tempPassword: tempPassword
    };

    console.log('📧 Sending welcome email...');
    const emailResult = await sendWelcomeEmail(emailData);
    
    if (!emailResult.success) {
      console.warn('⚠️ Welcome email failed to send:', emailResult.error);
      // Don't fail registration if email fails - user can still login
    } else {
      console.log('✅ Welcome email sent successfully');
    }

    // Success response (don't include password)
    res.status(201).json({
      success: true,
      message: 'Account succesvol aangemaakt! Check je email voor login instructies.',
      data: {
        username: influencerData.username,
        email: influencerData.email,
        name: influencerData.name,
        commission: influencerData.commission,
        emailSent: emailResult.success
      }
    });

  } catch (error) {
    console.error('❌ Registration error:', error);
    
    // Handle specific database errors
    if (error.message.includes('already exists')) {
      return res.status(409).json({
        success: false,
        error: 'Gebruikersnaam of email bestaat al'
      });
    }

    if (error.message.includes('RESEND_API_KEY')) {
      return res.status(201).json({
        success: true,
        message: 'Account aangemaakt! Email service is niet geconfigureerd - neem contact op voor login gegevens.',
        data: {
          username: req.body.username,
          email: req.body.email,
          emailSent: false
        }
      });
    }

    res.status(500).json({
      success: false,
      error: 'Er ging iets mis bij het aanmaken van je account. Probeer het opnieuw.'
    });
  }
} 