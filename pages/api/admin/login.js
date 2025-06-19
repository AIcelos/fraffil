module.exports = async function handler(req, res) {
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

  const { username, password } = req.body;

  console.log('Admin login attempt:', { username });

  if (!username || !password) {
    return res.status(400).json({ 
      success: false, 
      error: 'Username and password are required' 
    });
  }

  // Admin credentials - Updated with sven@filright.com access
  const adminCredentials = {
    'admin': 'admin123',
    'filright': 'filright2025',
    'stefan': 'stefan_admin123',
    'sven': 'sven_admin_2025'
  };

  if (adminCredentials[username] && adminCredentials[username] === password) {
    // Generate simple token (in production, use JWT)
    const token = `admin_${username}_${Date.now()}`;
    
    const adminUser = {
      username: username,
      role: 'admin',
      loginTime: new Date().toISOString()
    };

    console.log('Successful admin login:', username);

    return res.status(200).json({
      success: true,
      token: token,
      admin: adminUser,
      message: `Welcome back, ${username}!`
    });
  } else {
    console.log('Failed admin login attempt:', username);
    
    return res.status(401).json({
      success: false,
      error: 'Invalid admin credentials'
    });
  }
} 