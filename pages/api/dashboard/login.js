import { sql } from '@vercel/postgres';
import bcrypt from 'bcryptjs';

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
    console.log('🔐 Login attempt for:', username);

    // Database authentication via Neon PostgreSQL
    const result = await sql`
      SELECT ref, name, email, password, commission, status
      FROM influencers 
      WHERE ref = ${username.toLowerCase()}
      LIMIT 1
    `;
    
    const influencer = result.rows[0];
    
    if (!influencer) {
      console.log('❌ Influencer not found:', username);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if account is active
    if (influencer.status !== 'active') {
      console.log('❌ Inactive account:', username, 'Status:', influencer.status);
      return res.status(401).json({ error: 'Account is inactive' });
    }

    // Check if user has a password
    if (!influencer.password) {
      console.log('❌ No password set for user:', username);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, influencer.password);
    
    if (!isValidPassword) {
      console.log('❌ Invalid password for:', username);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    console.log('✅ Successful login for:', username);

    // Optionally update last login time
    try {
      await sql`
        UPDATE influencers 
        SET last_login = NOW() 
        WHERE ref = ${username.toLowerCase()}
      `;
    } catch (updateError) {
      console.warn('⚠️ Could not update last login time:', updateError.message);
    }

    return res.status(200).json({
      success: true,
      influencer: {
        username: influencer.ref,
        name: influencer.name,
        email: influencer.email,
        commission: influencer.commission,
        status: influencer.status,
        loginTime: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Login error:', error);
    console.error('❌ Error details:', {
      message: error.message,
      stack: error.stack,
      username: username
    });
    
    // If bcrypt error
    if (error.message.includes('bcrypt') || error.message.includes('hash')) {
      console.error('❌ bcrypt error - user may not have password set');
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    return res.status(500).json({ 
      error: 'Login failed',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
} 