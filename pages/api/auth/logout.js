import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Cookie');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get session token from cookie
    let sessionToken = null;

    if (req.headers.cookie) {
      const cookies = req.headers.cookie.split(';').reduce((acc, cookie) => {
        const [key, value] = cookie.trim().split('=');
        acc[key] = value;
        return acc;
      }, {});
      sessionToken = cookies.session_token;
    }

    if (sessionToken) {
      // Get user info before deleting session
      const sessionResult = await sql`
        SELECT user_ref, user_name 
        FROM user_sessions 
        WHERE session_token = ${sessionToken}
        LIMIT 1
      `;

      const session = sessionResult.rows[0];
      
      // Delete session from database
      const deleteResult = await sql`
        DELETE FROM user_sessions 
        WHERE session_token = ${sessionToken}
      `;

      if (deleteResult.rowCount > 0) {
        console.log('✅ Session deleted for user:', session?.user_ref || 'unknown');
      } else {
        console.log('⚠️ No session found to delete');
      }
    }

    // Clear cookie
    res.setHeader('Set-Cookie', [
      'session_token=; HttpOnly; Secure; SameSite=Strict; Max-Age=0; Path=/'
    ]);

    console.log('🚪 User logged out successfully');

    return res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });

  } catch (error) {
    console.error('❌ Logout error:', error);
    
    // Still clear cookie even if database operation fails
    res.setHeader('Set-Cookie', [
      'session_token=; HttpOnly; Secure; SameSite=Strict; Max-Age=0; Path=/'
    ]);
    
    return res.status(500).json({
      success: false,
      error: 'Logout failed',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
} 