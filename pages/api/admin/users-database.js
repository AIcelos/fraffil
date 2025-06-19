const { sql } = require('@vercel/postgres');
const bcrypt = require('bcryptjs');

// Database functions using traditional query syntax
async function getAllInfluencersDB() {
  try {
    // Use traditional query instead of template literal
    const result = await sql.query(`
      SELECT 
        ref, name, email, phone, instagram, tiktok, youtube,
        commission, status, notes, created_at, updated_at
      FROM influencers 
      ORDER BY created_at DESC
    `);
    return result.rows;
  } catch (error) {
    console.error('Error fetching all influencers:', error);
    return [];
  }
}

async function createInfluencerDB(data) {
  try {
    console.log('🔍 Creating influencer with data:', {
      ref: data.ref,
      email: data.email,
      name: data.name
    });

    // Check if username or email already exists using traditional query
    const existingUser = await sql.query(
      'SELECT ref, email FROM influencers WHERE ref = $1 OR email = $2',
      [data.ref, data.email]
    );

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

    // Create influencer using traditional query
    const result = await sql.query(`
      INSERT INTO influencers (
        ref, name, email, phone, instagram, tiktok, youtube,
        commission, status, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
      RETURNING *
    `, [
      data.ref, 
      data.name || '', 
      data.email || '', 
      data.phone || '', 
      data.instagram || '', 
      data.tiktok || '', 
      data.youtube || '', 
      data.commission || 6.00, 
      data.status || 'active', 
      data.notes || ''
    ]);

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
    getAllInfluencersDB()
      .then(users => {
        console.log('📋 Admin requesting all users from database - found:', users.length);
        
        res.status(200).json({
          success: true,
          users: users,
          count: users.length,
          message: users.length > 0 
            ? `${users.length} gebruiker(s) geladen uit PostgreSQL database`
            : 'Geen gebruikers gevonden in database. Voeg de eerste gebruiker toe!'
        });
      })
      .catch(error => {
        console.error('❌ Database error:', error);
        res.status(500).json({
          success: false,
          error: 'Database fout bij ophalen gebruikers: ' + error.message
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
    createInfluencerDB(userData)
      .then(result => {
        if (result.success) {
          console.log('✅ User created in database:', userData.ref);
          res.status(201).json({
            success: true,
            message: `Gebruiker ${userData.ref} succesvol aangemaakt in PostgreSQL database!`,
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
          error: 'Database fout bij aanmaken gebruiker: ' + error.message
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