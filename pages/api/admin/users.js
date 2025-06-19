import { sql } from '@vercel/postgres';
import bcrypt from 'bcryptjs';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
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
    if (req.method === 'GET') {
      // Haal alle gebruikers op
      console.log('📋 Admin requesting all users from database');
      
      const result = await sql`
        SELECT ref, name, email, phone, instagram, tiktok, youtube,
               commission, status, notes, created_at, updated_at
        FROM influencers 
        ORDER BY created_at DESC
      `;
      
      const users = result.rows;
      console.log(`📋 Admin requesting all users from database - found: ${users.length}`);
      
      res.status(200).json({
        success: true,
        users: users,
        count: users.length
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

      // Check if user already exists
      const existingUser = await sql`
        SELECT ref, email FROM influencers 
        WHERE ref = ${userData.ref} OR email = ${userData.email.toLowerCase()}
      `;

      if (existingUser.rows.length > 0) {
        const existing = existingUser.rows[0];
        const field = existing.ref === userData.ref ? 'username' : 'email';
        return res.status(400).json({
          success: false,
          error: `${field} bestaat al`
        });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 12);
      
      // Create user
      const result = await sql`
        INSERT INTO influencers (
          ref, name, email, phone, instagram, tiktok, youtube,
          commission, status, notes, password, created_at
        ) VALUES (
          ${userData.ref}, ${userData.name}, ${userData.email.toLowerCase()}, 
          ${userData.phone || ''}, ${userData.instagram || ''}, 
          ${userData.tiktok || ''}, ${userData.youtube || ''}, 
          ${parseFloat(userData.commission) || 6.00}, 
          ${userData.status || 'active'}, ${userData.notes || ''}, 
          ${hashedPassword}, NOW()
        )
        RETURNING ref, name, email, commission, status, created_at
      `;

      const newUser = result.rows[0];
      console.log('✅ User created successfully:', newUser.ref);

      res.status(201).json({
        success: true,
        message: `Gebruiker ${newUser.ref} succesvol aangemaakt`,
        user: newUser
      });

    } else {
      res.status(405).json({
        success: false,
        error: 'Method not allowed'
      });
    }

  } catch (error) {
    console.error('❌ Admin users API error:', error);
    
    if (error.message.includes('duplicate key') || error.message.includes('already exists')) {
      const field = error.message.includes('email') ? 'email' : 'username';
      return res.status(400).json({
        success: false,
        error: `${field} bestaat al`
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
} 