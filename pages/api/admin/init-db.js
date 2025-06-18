import { sql } from '@vercel/postgres';

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

  try {
    console.log('🚀 Starting database initialization...');

    // Create influencers table
    await sql`
      CREATE TABLE IF NOT EXISTS influencers (
        id SERIAL PRIMARY KEY,
        ref VARCHAR(100) UNIQUE NOT NULL,
        name VARCHAR(255),
        email VARCHAR(255) UNIQUE,
        phone VARCHAR(50),
        instagram VARCHAR(255),
        tiktok VARCHAR(255),
        youtube VARCHAR(255),
        commission DECIMAL(5,2) DEFAULT 10.00,
        password VARCHAR(255),
        status VARCHAR(50) DEFAULT 'active',
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;
    console.log('✅ Influencers table created/verified');

    // Create system_settings table
    await sql`
      CREATE TABLE IF NOT EXISTS system_settings (
        id SERIAL PRIMARY KEY,
        key VARCHAR(255) UNIQUE NOT NULL,
        value TEXT,
        description TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;
    console.log('✅ System settings table created/verified');

    // Create reset_tokens table (NEW)
    await sql`
      CREATE TABLE IF NOT EXISTS reset_tokens (
        id SERIAL PRIMARY KEY,
        token VARCHAR(64) UNIQUE NOT NULL,
        email VARCHAR(255) NOT NULL,
        username VARCHAR(100) NOT NULL,
        name VARCHAR(255),
        expires_at TIMESTAMP NOT NULL,
        used BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;
    console.log('✅ Reset tokens table created/verified');

    // Create indexes for better performance
    await sql`CREATE INDEX IF NOT EXISTS idx_influencers_email ON influencers(email)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_influencers_ref ON influencers(ref)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_reset_tokens_token ON reset_tokens(token)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_reset_tokens_expires ON reset_tokens(expires_at)`;
    console.log('✅ Database indexes created/verified');

    // Insert default admin settings if they don't exist
    await sql`
      INSERT INTO system_settings (key, value, description)
      VALUES ('admin_initialized', 'true', 'Database initialization completed')
      ON CONFLICT (key) DO NOTHING
    `;

    console.log('🎉 Database initialization completed successfully!');

    res.status(200).json({
      success: true,
      message: 'Database initialized successfully',
      tables: [
        'influencers',
        'system_settings', 
        'reset_tokens'
      ],
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
} 