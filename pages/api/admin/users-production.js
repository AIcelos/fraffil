const { sql } = require('@vercel/postgres');
const bcrypt = require('bcryptjs');

// Database functions directly in this file to avoid import issues
async function getAllInfluencersLocal() {
  try {
    const result = await sql`
      SELECT 
        ref, name, email, phone, instagram, tiktok, youtube,
        commission, status, notes, created_at, updated_at
      FROM influencers 
      ORDER BY created_at DESC
    `;
    return result.rows;
  } catch (error) {
    console.error('Error fetching all influencers:', error);
    return [];
  }
}

async function createInfluencerLocal(data) {
  try {
    console.log('🔍 Creating influencer with data:', {
      ref: data.ref,
      email: data.email,
      name: data.name
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
        error: `${field} bestaat al` 
      };
    }

    // Hash password if provided
    let hashedPassword = null;
    if (data.password) {
      hashedPassword = await bcrypt.hash(data.password, 12);
    }

    // Create influencer
    const result = await sql`
      INSERT INTO influencers (
        ref, name, email, phone, instagram, tiktok, youtube,
        commission, status, notes
      ) VALUES (
        ${data.ref}, ${data.name || ''}, ${data.email || ''}, 
        ${data.phone || ''}, ${data.instagram || ''}, ${data.tiktok || ''}, 
        ${data.youtube || ''}, ${data.commission || 6.00}, 
        ${data.status || 'active'}, ${data.notes || ''}
      ) RETURNING *
    `;

    console.log('✅ Influencer created successfully:', data.ref);
    return { 
      success: true, 
      data: result.rows[0] 
    };

  } catch (error) {
    console.error('❌ Error creating influencer:', error);
    return { 
      success: false, 
      error: 'Database error: ' + error.message 
    };
  }
}

function handler(req, res) {
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

  if (req.method === 'GET') {
    // Get all users from database
    getAllInfluencersLocal()
      .then(users => {
        console.log('📋 Admin requesting all users - found:', users.length);
        
        res.status(200).json({
          success: true,
          users: users,
          count: users.length,
          message: users.length > 0 
            ? `${users.length} gebruiker(s) geladen uit database`
            : 'Geen gebruikers gevonden in database. Voeg de eerste gebruiker toe!'
        });
      })
      .catch(error => {
        console.error('❌ Database error:', error);
        res.status(500).json({
          success: false,
          error: 'Database fout bij ophalen gebruikers'
        });
      });

  } else if (req.method === 'POST') {
    // Create new user in database
    const userData = req.body;
    
    console.log('👤 Admin creating new user in database:', userData.ref);

    // Basic validation
    if (!userData.ref || !userData.name || !userData.email) {
      return res.status(400).json({
        success: false,
        error: 'Username, naam en email zijn verplicht'
      });
    }

    // Create user in database
    createInfluencerLocal(userData)
      .then(result => {
        if (result.success) {
          console.log('✅ User created in database:', userData.ref);
          res.status(201).json({
            success: true,
            message: `Gebruiker ${userData.ref} succesvol aangemaakt in database!`,
            user: result.data
          });
        } else {
          console.error('❌ Failed to create user:', result.error);
          res.status(400).json({
            success: false,
            error: result.error
          });
        }
      })
      .catch(error => {
        console.error('❌ Database error creating user:', error);
        res.status(500).json({
          success: false,
          error: 'Database fout bij aanmaken gebruiker'
        });
      });

  } else {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }
}

module.exports = handler; 