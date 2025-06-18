import { getInfluencer } from '../../../lib/database.js';
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

    // Check database availability
    if (!process.env.POSTGRES_URL) {
      console.log('⚠️  Database not configured - using fallback authentication');
      
      // Fallback voor development zonder database
      const FALLBACK_USERS = {
        'annemieke': { password: 'annemieke123', name: 'Annemieke' },
        'stefan': { password: 'stefan123', name: 'Stefan' },
        'lisa': { password: 'lisa123', name: 'Lisa' },
        'mark': { password: 'mark123', name: 'Mark' },
        'finaltest': { password: 'finaltest123', name: 'Final Test' },
        'manual-test-456': { password: 'test123', name: 'Manual Test' }
      };

      const user = FALLBACK_USERS[username.toLowerCase()];
      
      if (!user || user.password !== password) {
        console.log('❌ Failed fallback login for:', username);
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      console.log('✅ Successful fallback login for:', username);
      return res.status(200).json({
        success: true,
        influencer: {
          username: username.toLowerCase(),
          name: user.name,
          loginTime: new Date().toISOString(),
          source: 'fallback'
        }
      });
    }

    // Database authentication
    const influencer = await getInfluencer(username.toLowerCase());
    
    if (!influencer) {
      console.log('❌ Influencer not found:', username);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if account is active
    if (influencer.status !== 'active') {
      console.log('❌ Inactive account:', username);
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

    console.log('✅ Successful database login for:', username);

    // Update last login time (optional)
    // await updateInfluencerLastLogin(username);

    return res.status(200).json({
      success: true,
      influencer: {
        username: influencer.username || influencer.ref,
        name: influencer.name,
        email: influencer.email,
        commission: influencer.commission,
        loginTime: new Date().toISOString(),
        source: 'database'
      }
    });

  } catch (error) {
    console.error('❌ Login error:', error);
    console.error('❌ Error details:', {
      message: error.message,
      stack: error.stack,
      username: username
    });
    
    // If database error, provide helpful message
    if (error.message.includes('missing_connection_string')) {
      return res.status(500).json({ 
        error: 'Database connection not configured. Contact administrator.' 
      });
    }
    
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