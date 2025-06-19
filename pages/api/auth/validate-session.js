import { sql } from '@vercel/postgres';

// Validate session token
async function validateSessionToken(sessionToken) {
  try {
    if (!sessionToken) {
      return { valid: false, error: 'No session token provided' };
    }

    // Get session from database
    const result = await sql`
      SELECT s.session_token, s.user_ref, s.user_name, s.user_email,
             s.created_at, s.expires_at, s.last_accessed,
             i.name, i.email, i.commission, i.status
      FROM user_sessions s
      JOIN influencers i ON s.user_ref = i.ref
      WHERE s.session_token = ${sessionToken}
      AND s.expires_at > NOW()
      LIMIT 1
    `;

    const session = result.rows[0];

    if (!session) {
      return { valid: false, error: 'Invalid or expired session' };
    }

    // Check if user is still active
    if (session.status !== 'active') {
      return { valid: false, error: 'User account is inactive' };
    }

    // Update last accessed time
    await sql`
      UPDATE user_sessions 
      SET last_accessed = NOW() 
      WHERE session_token = ${sessionToken}
    `;

    return {
      valid: true,
      user: {
        username: session.user_ref,
        name: session.name,
        email: session.email,
        commission: session.commission,
        status: session.status
      },
      session: {
        createdAt: session.created_at,
        expiresAt: session.expires_at,
        lastAccessed: new Date().toISOString()
      }
    };

  } catch (error) {
    console.error('❌ Session validation error:', error);
    return { valid: false, error: 'Session validation failed' };
  }
}

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Cookie');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get session token from cookie or Authorization header
    let sessionToken = null;

    // Try cookie first
    if (req.headers.cookie) {
      const cookies = req.headers.cookie.split(';').reduce((acc, cookie) => {
        const [key, value] = cookie.trim().split('=');
        acc[key] = value;
        return acc;
      }, {});
      sessionToken = cookies.session_token;
    }

    // Try Authorization header as fallback
    if (!sessionToken && req.headers.authorization) {
      const authHeader = req.headers.authorization;
      if (authHeader.startsWith('Bearer ')) {
        sessionToken = authHeader.substring(7);
      }
    }

    console.log('🔍 Validating session token:', sessionToken ? sessionToken.substring(0, 8) + '...' : 'none');

    const validation = await validateSessionToken(sessionToken);

    if (validation.valid) {
      console.log('✅ Valid session for user:', validation.user.username);
      return res.status(200).json({
        success: true,
        authenticated: true,
        user: validation.user,
        session: validation.session
      });
    } else {
      console.log('❌ Invalid session:', validation.error);
      return res.status(401).json({
        success: false,
        authenticated: false,
        error: validation.error
      });
    }

  } catch (error) {
    console.error('❌ Session validation error:', error);
    
    return res.status(500).json({
      success: false,
      authenticated: false,
      error: 'Session validation failed'
    });
  }
}

// Export validation function for use in other APIs
export { validateSessionToken }; 