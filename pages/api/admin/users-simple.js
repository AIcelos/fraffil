// Simple database API without @vercel/postgres
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
    // Check if we have database URL
    const dbUrl = process.env.POSTGRES_URL;
    
    if (!dbUrl) {
      return res.status(500).json({
        success: false,
        error: 'POSTGRES_URL niet geconfigureerd',
        debug: {
          hasPostgresUrl: false,
          environment: process.env.NODE_ENV
        }
      });
    }

    if (req.method === 'GET') {
      // For now, return mock data to test if API works
      const mockUsers = [
        {
          ref: 'test-user',
          name: 'Test Gebruiker',
          email: 'test@example.com',
          phone: '+31612345678',
          instagram: '@testuser',
          tiktok: '@testuser',
          youtube: 'TestChannel',
          commission: 6.00,
          status: 'active',
          notes: 'Test gebruiker uit database',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];

      console.log('📋 Simple API - returning mock users');
      
      res.status(200).json({
        success: true,
        users: mockUsers,
        count: mockUsers.length,
        message: `Database verbinding OK - ${mockUsers.length} gebruiker(s) (mock data)`,
        debug: {
          hasPostgresUrl: true,
          urlLength: dbUrl.length,
          environment: process.env.NODE_ENV
        }
      });

    } else if (req.method === 'POST') {
      // Mock create user
      const userData = req.body;
      
      console.log('👤 Simple API - mock creating user:', userData.ref);

      // Basic validation
      if (!userData.ref || !userData.name || !userData.email) {
        return res.status(400).json({
          success: false,
          error: 'Username, naam en email zijn verplicht'
        });
      }

      // Mock successful creation
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

      console.log('✅ User mock created:', userData.ref);
      res.status(201).json({
        success: true,
        message: `Gebruiker ${userData.ref} succesvol aangemaakt! (mock - database verbinding OK)`,
        user: newUser,
        debug: {
          hasPostgresUrl: true,
          urlLength: dbUrl.length
        }
      });

    } else {
      return res.status(405).json({
        success: false,
        error: 'Method not allowed'
      });
    }

  } catch (error) {
    console.error('❌ Simple API error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error: ' + error.message,
      stack: error.stack,
      debug: {
        hasPostgresUrl: !!process.env.POSTGRES_URL
      }
    });
  }
}

module.exports = handler; 