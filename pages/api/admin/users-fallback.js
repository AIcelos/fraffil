// Fallback users API - works without database
let memoryUsers = [];

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

  try {
    if (req.method === 'GET') {
      // Return users from memory
      console.log('📋 Fallback API - returning users from memory:', memoryUsers.length);
      
      res.status(200).json({
        success: true,
        users: memoryUsers,
        count: memoryUsers.length,
        fallback: true,
        message: memoryUsers.length > 0 
          ? `${memoryUsers.length} gebruiker(s) geladen (fallback mode - geen database)`
          : 'Geen gebruikers gevonden. Voeg de eerste gebruiker toe! (fallback mode)'
      });

    } else if (req.method === 'POST') {
      // Create new user in memory
      const userData = req.body;
      
      console.log('👤 Fallback API - creating user in memory:', userData.ref);

      // Basic validation
      if (!userData.ref || !userData.name || !userData.email) {
        return res.status(400).json({
          success: false,
          error: 'Username, naam en email zijn verplicht'
        });
      }

      // Check if user already exists
      const existingUser = memoryUsers.find(u => 
        u.ref === userData.ref || u.email === userData.email
      );

      if (existingUser) {
        const field = existingUser.ref === userData.ref ? 'username' : 'email';
        return res.status(400).json({
          success: false,
          error: `${field} bestaat al`
        });
      }

      // Create new user
      const newUser = {
        ref: userData.ref,
        name: userData.name,
        email: userData.email,
        phone: userData.phone || '',
        instagram: userData.instagram || '',
        tiktok: userData.tiktok || '',
        youtube: userData.youtube || '',
        commission: userData.commission || 6.00,
        status: userData.status || 'active',
        notes: userData.notes || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      memoryUsers.push(newUser);

      console.log('✅ User created in memory:', userData.ref);
      res.status(201).json({
        success: true,
        message: `Gebruiker ${userData.ref} succesvol aangemaakt! (fallback mode - geen database)`,
        user: newUser,
        fallback: true
      });

    } else {
      return res.status(405).json({
        success: false,
        error: 'Method not allowed'
      });
    }

  } catch (error) {
    console.error('❌ Fallback API error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error in fallback API: ' + error.message,
      fallback: true
    });
  }
}

module.exports = handler; 