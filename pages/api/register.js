import { sql } from '@vercel/postgres';
import { emailService } from '../../lib/email.js';
import bcrypt from 'bcryptjs';

// Functie om een tijdelijk wachtwoord te genereren
function generateTempPassword() {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
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

// Create influencer in database
async function createInfluencerDB(data) {
  try {
    console.log('🔍 Creating influencer with data:', {
      ref: data.ref,
      email: data.email,
      name: data.name,
      hasPassword: !!data.password
    });

    // Check if username or email already exists
    const existingUser = await sql`
      SELECT ref, email FROM influencers 
      WHERE ref = ${data.ref} OR email = ${data.email}
    `;

    if (existingUser.rows.length > 0) {
      const existing = existingUser.rows[0];
      const field = existing.ref === data.ref ? 'username' : 'email';
      return { 
        success: false, 
        error: `${field} already exists` 
      };
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 12);
    console.log('🔐 Password hashed for user:', data.ref);

    // Create influencer
    const result = await sql`
      INSERT INTO influencers (
        ref, name, email, phone, instagram, tiktok, youtube,
        commission, status, notes, password, created_at
      ) VALUES (
        ${data.ref}, ${data.name || ''}, ${data.email || ''}, 
        ${data.phone || ''}, ${data.instagram || ''}, ${data.tiktok || ''}, 
        ${data.youtube || ''}, ${data.commission || 6.00}, 
        ${data.status || 'active'}, ${data.notes || ''}, 
        ${hashedPassword}, NOW()
      )
      RETURNING ref, name, email, commission, status
    `;

    const newInfluencer = result.rows[0];
    console.log('✅ Influencer created:', newInfluencer.ref);

    return { 
      success: true, 
      influencer: newInfluencer 
    };

  } catch (error) {
    console.error('❌ Database error creating influencer:', error);
    
    if (error.message.includes('duplicate key') || error.message.includes('already exists')) {
      const field = error.message.includes('email') ? 'email' : 'username';
      return { 
        success: false, 
        error: `${field} already exists` 
      };
    }
    
    return { 
      success: false, 
      error: error.message 
    };
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('📝 Registration request received:', { username: req.body.username, email: req.body.email, name: req.body.name });
    
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
    console.log('🔐 Generated temp password for:', username);

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
      password: tempPassword,
      commission: 6.0,
      status: 'active',
      referredBy: referredBy?.trim() || null,
      notes: referredBy ? `Referred by: ${referredBy.trim()}` : null
    };

    console.log('👤 Creating new influencer:', {
      username: influencerData.username,
      email: influencerData.email,
      name: influencerData.name
    });

    // Create influencer in database
    const dbResult = await createInfluencerDB(influencerData);
    
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

    console.log('📧 Sending welcome email...');
    const emailResult = await emailService.sendWelcomeEmail(
      influencerData.email,
      influencerData.name,
      influencerData.username,
      tempPassword
    );
    
    if (!emailResult.success) {
      console.error('❌ Email error:', emailResult.error);
      // Account is al aangemaakt, maar email faalde
      return res.status(201).json({
        success: true,
        message: 'Account succesvol aangemaakt! Er was een probleem met het versturen van de welkomst email. Neem contact op met support voor je login gegevens.',
        username: influencerData.username,
        emailSent: false,
        emailError: emailResult.error
      });
    }

    console.log('✅ Welcome email sent successfully');

    // Success response (don't include password)
    res.status(201).json({
      success: true,
      message: 'Account succesvol aangemaakt! Check je email voor login instructies.',
      data: {
        username: influencerData.username,
        email: influencerData.email,
        name: influencerData.name,
        commission: influencerData.commission,
        emailSent: emailResult.success,
        messageId: emailResult.messageId
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