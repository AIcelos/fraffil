import { sql } from '@vercel/postgres';
import bcrypt from 'bcryptjs';

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

  const { username, password } = req.body;

  console.log('Admin login attempt:', { username });

  if (!username || !password) {
    return res.status(400).json({ 
      success: false, 
      error: 'Username and password are required' 
    });
  }

  try {
    // Check database for admin user
    const result = await sql`
      SELECT id, username, password_hash, email, role, status, last_login
      FROM admin_users 
      WHERE username = ${username} AND status = 'active'
    `;

    if (result.rows.length === 0) {
      console.log('Admin user not found or inactive:', username);
      return res.status(401).json({
        success: false,
        error: 'Invalid admin credentials'
      });
    }

    const adminUser = result.rows[0];

    // Verify password
    const isValidPassword = await bcrypt.compare(password, adminUser.password_hash);

    if (!isValidPassword) {
      console.log('Invalid password for admin:', username);
      return res.status(401).json({
        success: false,
        error: 'Invalid admin credentials'
      });
    }

    // Update last login timestamp
    await sql`
      UPDATE admin_users 
      SET last_login = NOW() 
      WHERE id = ${adminUser.id}
    `;

    // Generate simple token (in production, use JWT)
    const token = `admin_${username}_${Date.now()}`;
    
    const responseUser = {
      id: adminUser.id,
      username: adminUser.username,
      email: adminUser.email,
      role: adminUser.role,
      loginTime: new Date().toISOString()
    };

    console.log('Successful admin login:', username);

    return res.status(200).json({
      success: true,
      token: token,
      admin: responseUser,
      message: `Welcome back, ${username}!`
    });

  } catch (error) {
    console.error('Admin login error:', error);
    
    // Fallback to hardcoded credentials if database fails
    const adminCredentials = {
      'admin': 'admin123',
      'filright': 'filright2025',
      'stefan': 'stefan_admin123',
      'sven': 'sven_admin_2025'
    };

    if (adminCredentials[username] && adminCredentials[username] === password) {
      const token = `admin_${username}_${Date.now()}`;
      
      const adminUser = {
        username: username,
        role: 'admin',
        loginTime: new Date().toISOString()
      };

      console.log('Successful fallback admin login:', username);

      return res.status(200).json({
        success: true,
        token: token,
        admin: adminUser,
        message: `Welcome back, ${username}! (Fallback mode)`
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Database error during login. Please try again.'
    });
  }
} 