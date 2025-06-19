import { sql } from '@vercel/postgres';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

// Session duration: 24 hours
const SESSION_DURATION = 24 * 60 * 60 * 1000;

// Generate secure session token
function generateSessionToken() {
  return crypto.randomBytes(32).toString('hex');
}

// Create sessions table if not exists
async function ensureSessionsTable() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS user_sessions (
        id SERIAL PRIMARY KEY,
        session_token VARCHAR(255) UNIQUE NOT NULL,
        user_ref VARCHAR(100) NOT NULL,
        user_name VARCHAR(255),
        user_email VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW(),
        expires_at TIMESTAMP NOT NULL,
        last_accessed TIMESTAMP DEFAULT NOW(),
        user_agent TEXT,
        ip_address VARCHAR(45)
      )
    `;
    
    // Create index for faster lookups
    await sql`
      CREATE INDEX IF NOT EXISTS idx_sessions_token 
      ON user_sessions(session_token)
    `;
    
    await sql`
      CREATE INDEX IF NOT EXISTS idx_sessions_user 
      ON user_sessions(user_ref)
    `;
    
    return { success: true };
  } catch (error) {
    console.error('❌ Error creating sessions table:', error);
    return { success: false, error: error.message };
  }
}

// Save session to database
async function createSession(userRef, userName, userEmail, userAgent, ipAddress) {
  try {
    const sessionToken = generateSessionToken();
    const expiresAt = new Date(Date.now() + SESSION_DURATION);
    
    await sql`
      INSERT INTO user_sessions (
        session_token, user_ref, user_name, user_email, 
        expires_at, user_agent, ip_address
      ) VALUES (
        ${sessionToken}, ${userRef}, ${userName}, ${userEmail},
        ${expiresAt.toISOString()}, ${userAgent || ''}, ${ipAddress || ''}
      )
    `;
    
    console.log('✅ Session created for user:', userRef);
    return { success: true, sessionToken, expiresAt };
  } catch (error) {
    console.error('❌ Error creating session:', error);
    return { success: false, error: error.message };
  }
}

// Clean up expired sessions
async function cleanupExpiredSessions() {
  try {
    const result = await sql`
      DELETE FROM user_sessions 
      WHERE expires_at < NOW()
    `;
    
    if (result.rowCount > 0) {
      console.log(`🧹 Cleaned up ${result.rowCount} expired sessions`);
    }
  } catch (error) {
    console.warn('⚠️ Error cleaning up sessions:', error.message);
  }
}

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ 
      success: false, 
      error: 'Username and password required' 
    });
  }

  try {
    console.log('🔐 Login attempt for:', username);

    // Ensure sessions table exists
    const tableResult = await ensureSessionsTable();
    if (!tableResult.success) {
      console.error('❌ Failed to setup sessions table:', tableResult.error);
    }

    // Clean up expired sessions
    await cleanupExpiredSessions();

    // Get user from database
    const result = await sql`
      SELECT ref, name, email, password, commission, status
      FROM influencers 
      WHERE ref = ${username.toLowerCase()}
      LIMIT 1
    `;
    
    const user = result.rows[0];
    
    if (!user) {
      console.log('❌ User not found:', username);
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid credentials' 
      });
    }

    // Check if account is active
    if (user.status !== 'active') {
      console.log('❌ Inactive account:', username);
      return res.status(401).json({ 
        success: false, 
        error: 'Account is inactive' 
      });
    }

    // Check password
    if (!user.password) {
      console.log('❌ No password set for user:', username);
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid credentials' 
      });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    
    if (!isValidPassword) {
      console.log('❌ Invalid password for:', username);
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid credentials' 
      });
    }

    // Get client info
    const userAgent = req.headers['user-agent'] || '';
    const ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress || '';

    // Create session
    const sessionResult = await createSession(
      user.ref, 
      user.name, 
      user.email, 
      userAgent, 
      ipAddress
    );

    if (!sessionResult.success) {
      console.error('❌ Failed to create session:', sessionResult.error);
      return res.status(500).json({
        success: false,
        error: 'Failed to create session'
      });
    }

    // Update last login
    try {
      await sql`
        ALTER TABLE influencers 
        ADD COLUMN IF NOT EXISTS last_login TIMESTAMP
      `;
      
      await sql`
        UPDATE influencers 
        SET last_login = NOW() 
        WHERE ref = ${user.ref}
      `;
    } catch (updateError) {
      console.warn('⚠️ Could not update last login:', updateError.message);
    }

    console.log('✅ Successful login for:', username);

    // Set secure HTTP-only cookie
    const cookieOptions = [
      `session_token=${sessionResult.sessionToken}`,
      'HttpOnly',
      'Secure',
      'SameSite=Strict',
      `Max-Age=${SESSION_DURATION / 1000}`,
      'Path=/'
    ];

    res.setHeader('Set-Cookie', cookieOptions.join('; '));

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      user: {
        username: user.ref,
        name: user.name,
        email: user.email,
        commission: user.commission,
        status: user.status
      },
      session: {
        expiresAt: sessionResult.expiresAt,
        // Don't send token in response - it's in HTTP-only cookie
      }
    });

  } catch (error) {
    console.error('❌ Login error:', error);
    
    return res.status(500).json({ 
      success: false,
      error: 'Login failed',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
} 