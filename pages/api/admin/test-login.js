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

  console.log('Test login attempt:', { username, password });

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
      WHERE username = ${username}
    `;

    console.log('Database query result:', result.rows);

    if (result.rows.length === 0) {
      return res.status(200).json({
        success: false,
        error: 'User not found',
        debug: {
          username: username,
          found: false
        }
      });
    }

    const adminUser = result.rows[0];

    // Test password comparison
    const isValidPassword = await bcrypt.compare(password, adminUser.password_hash);
    
    console.log('Password comparison:', {
      provided: password,
      stored_hash: adminUser.password_hash,
      valid: isValidPassword
    });

    return res.status(200).json({
      success: isValidPassword,
      debug: {
        username: username,
        found: true,
        user_status: adminUser.status,
        password_valid: isValidPassword,
        user_email: adminUser.email,
        user_role: adminUser.role
      }
    });

  } catch (error) {
    console.error('Test login error:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      debug: {
        username: username,
        database_error: true
      }
    });
  }
} 