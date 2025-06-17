import { sql } from '@vercel/postgres';

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
        website VARCHAR(200),
        bank_account VARCHAR(50),
        bank_name VARCHAR(100),
        account_holder VARCHAR(100),
        preferred_payment VARCHAR(20) DEFAULT 'bank',
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
  try {
    const result = await sql`
      SELECT * FROM influencers 
      WHERE ref = ${ref}
    `;
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error fetching influencer:', error);
    throw error;
  }
}

export async function getAllInfluencers() {
  try {
    const result = await sql`
      SELECT * FROM influencers 
      ORDER BY created_at DESC
    `;
    return result.rows;
  } catch (error) {
    console.error('Error fetching all influencers:', error);
    throw error;
  }
}

export async function createInfluencer(data) {
  try {
    const result = await sql`
      INSERT INTO influencers (
        ref, name, email, phone, instagram, tiktok, youtube, website,
        bank_account, bank_name, account_holder, preferred_payment,
        commission, status, notes
      ) VALUES (
        ${data.ref}, ${data.name || ''}, ${data.email || ''}, 
        ${data.phone || ''}, ${data.instagram || ''}, ${data.tiktok || ''}, 
        ${data.youtube || ''}, ${data.website || ''}, ${data.bank_account || ''}, 
        ${data.bank_name || ''}, ${data.account_holder || ''}, ${data.preferred_payment || 'bank'},
        ${data.commission || 10.00}, ${data.status || 'active'}, ${data.notes || ''}
      ) RETURNING *
    `;
    return result.rows[0];
  } catch (error) {
    console.error('Error creating influencer:', error);
    throw error;
  }
}

export async function updateInfluencer(ref, data) {
  try {
    const result = await sql`
      UPDATE influencers SET
        name = ${data.name || ''},
        email = ${data.email || ''},
        phone = ${data.phone || ''},
        instagram = ${data.instagram || ''},
        tiktok = ${data.tiktok || ''},
        youtube = ${data.youtube || ''},
        website = ${data.website || ''},
        bank_account = ${data.bank_account || ''},
        bank_name = ${data.bank_name || ''},
        account_holder = ${data.account_holder || ''},
        preferred_payment = ${data.preferred_payment || 'bank'},
        commission = ${data.commission || 10.00},
        status = ${data.status || 'active'},
        notes = ${data.notes || ''},
        updated_at = CURRENT_TIMESTAMP
      WHERE ref = ${ref}
      RETURNING *
    `;
    return result.rows[0];
  } catch (error) {
    console.error('Error updating influencer:', error);
    throw error;
  }
}

export async function deleteInfluencer(ref) {
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