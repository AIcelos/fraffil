const { getAllInfluencers, createInfluencer } = require('../../../lib/database.js');
const bcrypt = require('bcryptjs');

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Simple admin authentication (in productie: gebruik JWT tokens)
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'Geen geldige authenticatie'
    });
  }

  try {
    if (req.method === 'GET') {
      // Haal alle gebruikers op
      console.log('📋 Admin requesting all users');
      
      const users = await getAllInfluencers();
      
      res.status(200).json({
        success: true,
        users: users || [],
        count: users?.length || 0
      });

    } else if (req.method === 'POST') {
      // Maak nieuwe gebruiker aan
      const userData = req.body;
      
      console.log('👤 Admin creating new user:', userData.ref);

      // Validatie
      if (!userData.ref || !userData.name || !userData.email || !userData.password) {
        return res.status(400).json({
          success: false,
          error: 'Username, naam, email en wachtwoord zijn verplicht'
        });
      }

      if (userData.password.length < 6) {
        return res.status(400).json({
          success: false,
          error: 'Wachtwoord moet minimaal 6 karakters lang zijn'
        });
      }

      // Maak gebruiker aan (password wordt gehashed in createInfluencer)
      const result = await createInfluencer({
        ref: userData.ref,
        name: userData.name,
        email: userData.email.toLowerCase(),
        phone: userData.phone || '',
        instagram: userData.instagram || '',
        tiktok: userData.tiktok || '',
        youtube: userData.youtube || '',
        commission: parseFloat(userData.commission) || 6.00,
        status: userData.status || 'active',
        notes: userData.notes || '',
        password: userData.password // Plain text - wordt gehashed in createInfluencer
      });

      if (result.success) {
        console.log('✅ User created successfully:', userData.ref);
        res.status(201).json({
          success: true,
          message: `Gebruiker ${userData.ref} succesvol aangemaakt`,
          user: result.data
        });
      } else {
        console.error('❌ Failed to create user:', result.error);
        res.status(400).json({
          success: false,
          error: result.error
        });
      }

    } else {
      res.status(405).json({
        success: false,
        error: 'Method not allowed'
      });
    }

  } catch (error) {
    console.error('❌ Admin users API error:', error);
    
    res.status(500).json({
      success: false,
      error: 'Server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
} 