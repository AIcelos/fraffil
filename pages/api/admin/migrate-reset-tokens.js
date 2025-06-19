import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Simple admin authentication
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'Geen geldige authenticatie'
    });
  }

  try {
    console.log('🔄 Starting reset_tokens table migration...');

    // Step 1: Check if table exists and what columns it has
    const tableInfo = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'reset_tokens'
      ORDER BY column_name
    `;
    
    console.log('📋 Current table structure:', tableInfo.rows);

    // Step 2: Drop the existing table and recreate with correct schema
    console.log('🗑️ Dropping existing reset_tokens table...');
    await sql`DROP TABLE IF EXISTS reset_tokens`;
    
    console.log('🔧 Creating new reset_tokens table with correct schema...');
    await sql`
      CREATE TABLE reset_tokens (
        id SERIAL PRIMARY KEY,
        token VARCHAR(255) UNIQUE NOT NULL,
        email VARCHAR(255) NOT NULL,
        userref VARCHAR(100) NOT NULL,
        username VARCHAR(255),
        expires_at TIMESTAMP NOT NULL,
        used BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;

    // Step 3: Verify new table structure
    const newTableInfo = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'reset_tokens'
      ORDER BY column_name
    `;
    
    console.log('✅ New table structure:', newTableInfo.rows);

    res.status(200).json({
      success: true,
      message: 'Reset tokens table migrated successfully',
      migration: {
        oldColumns: tableInfo.rows,
        newColumns: newTableInfo.rows,
        action: 'dropped_and_recreated'
      }
    });

  } catch (error) {
    console.error('❌ Migration error:', error);
    
    res.status(500).json({
      success: false,
      error: 'Migration failed: ' + error.message,
      details: error.stack
    });
  }
} 