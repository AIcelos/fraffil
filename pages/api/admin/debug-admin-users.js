import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const result = await sql`
      SELECT id, username, email, role, status, created_at, last_login
      FROM admin_users 
      ORDER BY created_at DESC
    `;

    return res.status(200).json({
      success: true,
      count: result.rows.length,
      admins: result.rows
    });

  } catch (error) {
    console.error('Debug admin users error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
} 