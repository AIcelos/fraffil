import { sql } from '@vercel/postgres';

// Explicit connection check
function isDbAvailable() {
  const dbUrl = process.env.POSTGRES_URL;
  const nodeEnv = process.env.NODE_ENV;
  const vercelEnv = process.env.VERCEL_ENV;
  
  console.log('🔍 Database availability check:');
  console.log('  - NODE_ENV:', nodeEnv);
  console.log('  - VERCEL_ENV:', vercelEnv);
  console.log('  - POSTGRES_URL exists:', !!dbUrl);
  console.log('  - POSTGRES_URL length:', dbUrl ? dbUrl.length : 0);
  console.log('  - POSTGRES_URL prefix:', dbUrl ? dbUrl.substring(0, 30) + '...' : 'NOT_SET');
  
  // Check all postgres-related env vars
  const postgresKeys = Object.keys(process.env).filter(key => 
    key.toLowerCase().includes('postgres') || 
    key.toLowerCase().includes('database') ||
    key.toLowerCase().includes('db_')
  );
  console.log('  - All DB-related env keys:', postgresKeys);
  
  const isAvailable = !!dbUrl;
  console.log('  - Final result:', isAvailable ? 'AVAILABLE' : 'NOT_AVAILABLE');
  
  return isAvailable;
}

// Database connection utility
export async function query(text, params) {
  try {
    const result = await sql.query(text, params || []);
    return result;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

// Initialize database tables
export async function initializeDatabase() {
  if (!isDbAvailable()) {
    console.log('⚠️  Database not available, skipping initialization');
    throw new Error('Database URL not configured');
  }
  
  try {
    console.log('🗄️ Initializing database tables...');
    
    // Create influencers table
    await sql`
      CREATE TABLE IF NOT EXISTS influencers (
        id SERIAL PRIMARY KEY,
        ref VARCHAR(50) UNIQUE NOT NULL,
        name VARCHAR(100),
        email VARCHAR(100),
        phone VARCHAR(20),
        instagram VARCHAR(100),
        tiktok VARCHAR(100),
        youtube VARCHAR(100),
        commission DECIMAL(5,2) DEFAULT 10.00,
        status VARCHAR(20) DEFAULT 'active',
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create admin users table
    await sql`
      CREATE TABLE IF NOT EXISTS admin_users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(20) DEFAULT 'admin',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_login TIMESTAMP
      )
    `;

    // Create system settings table
    await sql`
      CREATE TABLE IF NOT EXISTS system_settings (
        id SERIAL PRIMARY KEY,
        key VARCHAR(100) UNIQUE NOT NULL,
        value TEXT,
        description TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    console.log('✅ Database tables initialized successfully');
    return { success: true };
  } catch (error) {
    console.error('❌ Database initialization error:', error);
    throw error;
  }
}

// Influencer CRUD operations
export async function getInfluencer(ref) {
  if (!isDbAvailable()) {
    console.log('⚠️  Database not available, skipping query');
    return null;
  }
  
  try {
    const result = await sql`
      SELECT 
        ref, name, email, phone, instagram, tiktok, youtube,
        commission, status, notes, created_at, updated_at
      FROM influencers 
      WHERE ref = ${ref}
    `;
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error fetching influencer:', error);
    throw error;
  }
}

export async function getAllInfluencers() {
  if (!isDbAvailable()) {
    console.log('⚠️  Database not available, returning empty array');
    return [];
  }
  
  try {
    const result = await sql`
      SELECT 
        ref, name, email, phone, instagram, tiktok, youtube,
        commission, status, notes, created_at, updated_at
      FROM influencers 
      ORDER BY created_at DESC
    `;
    return result.rows;
  } catch (error) {
    console.error('Error fetching all influencers:', error);
    throw error;
  }
}

export async function createInfluencer(data) {
  if (!isDbAvailable()) {
    console.log('⚠️  Database not available, cannot create influencer');
    return { success: false, error: 'Database not available' };
  }
  
  try {
    console.log('🔍 Creating influencer with data:', {
      ref: data.ref,
      email: data.email,
      name: data.name
    });

    // Check if username or email already exists
    const existingUser = await sql`
      SELECT ref, email FROM influencers 
      WHERE ref = ${data.ref} OR email = ${data.email}
    `;

    if (existingUser.rows.length > 0) {
      const existing = existingUser.rows[0];
      const field = existing.ref === data.ref ? 'username' : 'email';
      return { 
        success: false, 
        error: `${field} already exists` 
      };
    }

    // Create influencer
    const result = await sql`
      INSERT INTO influencers (
        ref, name, email, phone, instagram, tiktok, youtube,
        commission, status, notes
      ) VALUES (
        ${data.ref}, ${data.name || ''}, ${data.email || ''}, 
        ${data.phone || ''}, ${data.instagram || ''}, ${data.tiktok || ''}, 
        ${data.youtube || ''}, ${data.commission || 6.00}, 
        ${data.status || 'active'}, ${data.notes || ''}
      ) RETURNING 
        ref, name, email, phone, instagram, tiktok, youtube,
        commission, status, notes, created_at, updated_at
    `;

    console.log('✅ Influencer created successfully:', result.rows[0].ref);
    return { success: true, data: result.rows[0] };

  } catch (error) {
    console.error('❌ Error creating influencer:', error);
    
    // Handle specific PostgreSQL errors
    if (error.message.includes('duplicate key') || error.code === '23505') {
      return { 
        success: false, 
        error: 'Username or email already exists' 
      };
    }
    
    return { 
      success: false, 
      error: error.message 
    };
  }
}

export async function updateInfluencer(ref, data) {
  if (!isDbAvailable()) {
    console.log('⚠️  Database not available, cannot update influencer');
    throw new Error('Database not available');
  }
  
  try {
    const result = await sql`
      UPDATE influencers SET
        name = ${data.name || ''},
        email = ${data.email || ''},
        phone = ${data.phone || ''},
        instagram = ${data.instagram || ''},
        tiktok = ${data.tiktok || ''},
        youtube = ${data.youtube || ''},
        commission = ${data.commission || 10.00},
        status = ${data.status || 'active'},
        notes = ${data.notes || ''},
        updated_at = CURRENT_TIMESTAMP
      WHERE ref = ${ref}
      RETURNING 
        ref, name, email, phone, instagram, tiktok, youtube,
        commission, status, notes, created_at, updated_at
    `;
    return result.rows[0];
  } catch (error) {
    console.error('Error updating influencer:', error);
    throw error;
  }
}

export async function deleteInfluencer(ref) {
  if (!isDbAvailable()) {
    console.log('⚠️  Database not available, cannot delete influencer');
    throw new Error('Database not available');
  }
  
  try {
    await sql`
      DELETE FROM influencers 
      WHERE ref = ${ref}
    `;
    return { success: true };
  } catch (error) {
    console.error('Error deleting influencer:', error);
    throw error;
  }
}

// System settings
export async function getSetting(key) {
  try {
    const result = await sql`
      SELECT value FROM system_settings 
      WHERE key = ${key}
    `;
    return result.rows[0]?.value || null;
  } catch (error) {
    console.error('Error fetching setting:', error);
    throw error;
  }
}

export async function setSetting(key, value, description = '') {
  try {
    await sql`
      INSERT INTO system_settings (key, value, description)
      VALUES (${key}, ${value}, ${description})
      ON CONFLICT (key) 
      DO UPDATE SET 
        value = EXCLUDED.value,
        description = EXCLUDED.description,
        updated_at = CURRENT_TIMESTAMP
    `;
    return { success: true };
  } catch (error) {
    console.error('Error setting value:', error);
    throw error;
  }
} 