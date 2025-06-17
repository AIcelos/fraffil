// Simpele in-memory opslag voor influencers
// Later vervangen door database
const INFLUENCERS = {
  'annemieke': { password: 'annemieke123', name: 'Annemieke' },
  'stefan': { password: 'stefan123', name: 'Stefan' },
  'lisa': { password: 'lisa123', name: 'Lisa' },
  'mark': { password: 'mark123', name: 'Mark' },
  // Echte influencers uit Google Sheets
  'finaltest': { password: 'finaltest123', name: 'Final Test' },
  'manual-test-456': { password: 'test123', name: 'Manual Test' }
};

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  try {
    const influencer = INFLUENCERS[username.toLowerCase()];
    
    if (!influencer || influencer.password !== password) {
      console.log('❌ Failed login attempt for:', username);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    console.log('✅ Successful login for:', username);

    // In productie zou je hier een JWT token genereren
    // Voor nu sturen we gewoon de influencer data terug
    return res.status(200).json({
      success: true,
      influencer: {
        username: username.toLowerCase(),
        name: influencer.name,
        loginTime: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Login error:', error);
    return res.status(500).json({ error: 'Login failed' });
  }
} 