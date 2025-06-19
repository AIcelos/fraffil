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
    // Return empty users list for now
    return res.status(200).json({
      success: true,
      users: [],
      count: 0,
      message: 'User management is working! Database integration coming soon.'
    });

  } else if (req.method === 'POST') {
    // Simulate user creation
    const userData = req.body;

    // Basic validation
    if (!userData.ref || !userData.name || !userData.email) {
      return res.status(400).json({
        success: false,
        error: 'Username, naam en email zijn verplicht'
      });
    }

    // Simulate successful creation
    return res.status(201).json({
      success: true,
      message: `Gebruiker ${userData.ref} geregistreerd! Database integratie wordt toegevoegd.`,
      user: {
        ref: userData.ref,
        name: userData.name,
        email: userData.email,
        status: 'pending',
        created: new Date().toISOString()
      }
    });

  } else {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }
} 