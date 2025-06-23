import { createInfluencer } from '../../../lib/database.js';
import { emailService } from '../../../lib/email.js';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      name, 
      email, 
      phone, 
      instagram, 
      tiktok, 
      youtube, 
      commission, 
      notes,
      ref 
    } = req.body;

    console.log('📧 Sending invitation for:', { name, email, ref });

    // Validatie
    if (!name || !email || !ref) {
      return res.status(400).json({
        success: false,
        error: 'Name, email and ref are required'
      });
    }

    // Genereer een wachtwoord voor de nieuwe gebruiker
    const password = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-4);
    
    // Maak de influencer aan in de database
    const influencerData = {
      ref: ref,
      name: name,
      email: email,
      phone: phone || '',
      instagram: instagram || '',
      tiktok: tiktok || '',
      youtube: youtube || '',
      commission: commission || 10.00,
      status: 'active',
      notes: notes || '',
      password: password
    };

    const createResult = await createInfluencer(influencerData);

    if (!createResult.success) {
      return res.status(400).json({
        success: false,
        error: createResult.error
      });
    }

    // Stuur welkomst email met login gegevens
    try {
      await emailService.sendWelcomeEmail(email, name, ref, password);

      console.log('✅ Welcome email sent to:', email);

      return res.status(200).json({
        success: true,
        message: 'Invitation sent successfully',
        influencer: {
          ref: ref,
          name: name,
          email: email,
          status: 'active'
        },
        credentials: {
          username: ref,
          password: password
        },
        timestamp: new Date().toISOString()
      });

    } catch (emailError) {
      console.error('❌ Email sending failed:', emailError);
      
      // User is aangemaakt maar email is gefaald
      return res.status(200).json({
        success: true,
        warning: 'User created but email failed to send',
        message: 'Invitation created but email delivery failed',
        influencer: {
          ref: ref,
          name: name,
          email: email,
          status: 'active'
        },
        credentials: {
          username: ref,
          password: password
        },
        emailError: emailError.message,
        timestamp: new Date().toISOString()
      });
    }

  } catch (error) {
    console.error('❌ Send invitation error:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Failed to send invitation',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
} 