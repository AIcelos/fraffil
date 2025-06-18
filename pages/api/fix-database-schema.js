import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🔧 Fixing database schema...');

    // Check current table structure
    const tableInfo = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'influencers'
      ORDER BY ordinal_position
    `;

    console.log('📋 Current table structure:', tableInfo.rows);

    // Check if password column exists
    const hasPasswordColumn = tableInfo.rows.some(col => col.column_name === 'password');
    
    if (!hasPasswordColumn) {
      console.log('🔧 Adding password column...');
      await sql`ALTER TABLE influencers ADD COLUMN password VARCHAR(255)`;
      console.log('✅ Password column added');
    } else {
      console.log('✅ Password column already exists');
    }

    // Get updated table structure
    const updatedTableInfo = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'influencers'
      ORDER BY ordinal_position
    `;

    // Check existing users and their passwords
    const users = await sql`
      SELECT ref, name, email, 
             CASE 
               WHEN password IS NULL THEN 'NULL'
               WHEN password = '' THEN 'EMPTY'
               ELSE 'HAS_PASSWORD'
             END as password_status,
             CHAR_LENGTH(password) as password_length
      FROM influencers 
      ORDER BY created_at DESC
      LIMIT 10
    `;

    return res.status(200).json({
      success: true,
      message: 'Database schema check completed',
      originalColumns: tableInfo.rows,
      updatedColumns: updatedTableInfo.rows,
      hasPasswordColumn: hasPasswordColumn,
      recentUsers: users.rows,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Database schema fix error:', error);
    
    return res.status(500).json({
      success: false,
      error: error.message,
      details: error.stack
    });
  }
} 