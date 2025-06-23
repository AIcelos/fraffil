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
    const { name, email, ref } = req.body;

    console.log('📧 Test invitation for:', { name, email, ref });

    // Validatie
    if (!name || !email || !ref) {
      return res.status(400).json({
        success: false,
        error: 'Name, email and ref are required'
      });
    }

    // Genereer een wachtwoord voor de nieuwe gebruiker
    const password = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-4);
    
    return res.status(200).json({
      success: true,
      message: 'Test invitation successful',
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

  } catch (error) {
    console.error('❌ Test invitation error:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Failed to process test invitation',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
} 