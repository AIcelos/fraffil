// Tijdelijke in-memory opslag voor gebruikers
let tempUsers = [];

export default function handler(req, res) {
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
    // Return current users list
    console.log('📋 Admin requesting all users - found:', tempUsers.length);
    
    return res.status(200).json({
      success: true,
      users: tempUsers,
      count: tempUsers.length,
      message: tempUsers.length > 0 
        ? `${tempUsers.length} gebruiker(s) geladen (tijdelijke opslag)`
        : 'Geen gebruikers gevonden. Voeg de eerste gebruiker toe!'
    });

  } else if (req.method === 'POST') {
    // Create new user and store in memory
    const userData = req.body;
    
    console.log('👤 Admin creating new user:', userData.ref);

    // Basic validation
    if (!userData.ref || !userData.name || !userData.email) {
      return res.status(400).json({
        success: false,
        error: 'Username, naam en email zijn verplicht'
      });
    }

    // Check if user already exists
    const existingUser = tempUsers.find(user => user.ref === userData.ref);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: `Gebruiker ${userData.ref} bestaat al`
      });
    }

    // Create new user object
    const newUser = {
      id: tempUsers.length + 1,
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
      created: new Date().toISOString(),
      lastLogin: null,
      totalSales: 0,
      totalRevenue: 0
    };

    // Add to temporary storage
    tempUsers.push(newUser);

    console.log('✅ User created and stored:', userData.ref, '- Total users:', tempUsers.length);

    return res.status(201).json({
      success: true,
      message: `Gebruiker ${userData.ref} succesvol aangemaakt! (${tempUsers.length} gebruikers totaal)`,
      user: newUser
    });

  } else {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }
} 