const { sql } = require('@vercel/postgres');
const bcrypt = require('bcryptjs');

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
      name: data.name,
      hasPassword: !!data.password
    });

    // Eerst controleren of de password kolom bestaat
    try {
      await sql`SELECT password FROM influencers LIMIT 1`;
    } catch (columnError) {
      if (columnError.message.includes('column "password" does not exist')) {
        console.log('🔧 Adding password column to influencers table...');
        await sql`ALTER TABLE influencers ADD COLUMN IF NOT EXISTS password VARCHAR(255)`;
        console.log('✅ Password column added to influencers table');
      }
    }

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

    // Hash password if provided
    let hashedPassword = null;
    if (data.password) {
      hashedPassword = await bcrypt.hash(data.password, 12);
      console.log('🔐 Password hashed for user:', data.ref);
    }

    // Create influencer with hashed password
    const result = await sql`
      INSERT INTO influencers (
        ref, name, email, phone, instagram, tiktok, youtube,
        commission, status, notes, password
      ) VALUES (
        ${data.ref}, ${data.name || ''}, ${data.email || ''}, 
        ${data.phone || ''}, ${data.instagram || ''}, ${data.tiktok || ''}, 
        ${data.youtube || ''}, ${data.commission || 6.00}, 
        ${data.status || 'active'}, ${data.notes || ''}, ${hashedPassword}
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

// Get influencer by email (voor password reset)
export async function getInfluencerByEmail(email) {
  try {
    if (!process.env.POSTGRES_URL) {
      console.log('⚠️  Database not configured - POSTGRES_URL missing');
      throw new Error('Database not configured');
    }

    const result = await sql`
      SELECT * FROM influencers
      WHERE email = ${email}
      LIMIT 1
    `;
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return result.rows[0];
  } catch (error) {
    console.error('❌ Error fetching influencer by email:', error);
    throw error;
  }
}

// Update influencer password (voor password reset)
export async function updateInfluencerPassword(username, hashedPassword) {
  try {
    if (!process.env.POSTGRES_URL) {
      console.log('⚠️  Database not configured - POSTGRES_URL missing');
      throw new Error('Database not configured');
    }

    console.log('🔐 Updating password for user:', username);

    // Eerst controleren of de password kolom bestaat
    try {
      await sql`SELECT password FROM influencers LIMIT 1`;
    } catch (columnError) {
      if (columnError.message.includes('column "password" does not exist')) {
        console.log('🔧 Adding password column to influencers table...');
        await sql`ALTER TABLE influencers ADD COLUMN IF NOT EXISTS password VARCHAR(255)`;
        console.log('✅ Password column added to influencers table');
      }
    }

    const result = await sql`
      UPDATE influencers 
      SET password = ${hashedPassword}, 
          updated_at = NOW()
      WHERE ref = ${username}
      RETURNING ref, email, name
    `;
    
    if (result.rows.length === 0) {
      console.log('❌ User not found for password update:', username);
      return { success: false, error: 'User not found' };
    }
    
    console.log('✅ Password updated for:', username);
    return { success: true, user: result.rows[0] };
    
  } catch (error) {
    console.error('❌ Error updating password:', error);
    console.error('❌ Error details:', {
      message: error.message,
      code: error.code,
      detail: error.detail,
      username
    });
    return { success: false, error: error.message };
  }
}

// Reset token management (voor password reset)
export async function saveResetToken(token, email, username, name, expiryTimestamp) {
  try {
    if (!process.env.POSTGRES_URL) {
      console.log('⚠️  Database not configured - POSTGRES_URL missing');
      // Return success for development mode
      return { success: true, fallback: true };
    }

    console.log('💾 Saving reset token for:', username, 'expires:', new Date(expiryTimestamp).toISOString());

    // Eerst oude tokens voor deze gebruiker verwijderen
    await sql`
      DELETE FROM reset_tokens 
      WHERE email = ${email} OR username = ${username}
    `;

    // Nieuwe token opslaan
    await sql`
      INSERT INTO reset_tokens (token, email, username, name, expires_at, created_at)
      VALUES (${token}, ${email}, ${username}, ${name}, ${new Date(expiryTimestamp)}, NOW())
    `;
    
    console.log('✅ Reset token saved for:', username);
    return { success: true };
    
  } catch (error) {
    console.error('❌ Error saving reset token:', error);
    console.error('❌ Error details:', {
      message: error.message,
      code: error.code,
      detail: error.detail,
      username,
      email,
      expiryTimestamp
    });
    
    // Als de tabel niet bestaat, probeer deze aan te maken
    if (error.message.includes('relation "reset_tokens" does not exist')) {
      try {
        console.log('🔧 Creating reset_tokens table...');
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
        
        // Probeer opnieuw
        await sql`
          INSERT INTO reset_tokens (token, email, username, name, expires_at, created_at)
          VALUES (${token}, ${email}, ${username}, ${name}, ${new Date(expiryTimestamp)}, NOW())
        `;
        
        console.log('✅ Reset tokens table created and token saved for:', username);
        return { success: true };
      } catch (createError) {
        console.error('❌ Error creating reset_tokens table:', createError);
        return { success: false, error: createError.message };
      }
    }
    
    return { success: false, error: error.message };
  }
}

export async function getResetToken(token) {
  try {
    if (!process.env.POSTGRES_URL) {
      console.log('⚠️  Database not configured - POSTGRES_URL missing');
      // Return null for development mode - will fall back to in-memory
      return null;
    }

    console.log('🔍 Looking up reset token:', token.substring(0, 8) + '...');

    const result = await sql`
      SELECT * FROM reset_tokens
      WHERE token = ${token} AND used = FALSE AND expires_at > NOW()
      LIMIT 1
    `;
    
    if (result.rows.length === 0) {
      console.log('❌ Reset token not found or expired:', token.substring(0, 8) + '...');
      return null;
    }
    
    console.log('✅ Found valid reset token for:', result.rows[0].username);
    return result.rows[0];
    
  } catch (error) {
    console.error('❌ Error fetching reset token:', error);
    console.error('❌ Error details:', {
      message: error.message,
      code: error.code,
      detail: error.detail,
      token: token.substring(0, 8) + '...'
    });
    return null;
  }
}

export async function markResetTokenAsUsed(token) {
  try {
    if (!process.env.POSTGRES_URL) {
      console.log('⚠️  Database not configured - POSTGRES_URL missing');
      return { success: true, fallback: true };
    }

    console.log('✏️  Marking reset token as used:', token.substring(0, 8) + '...');

    await sql`
      UPDATE reset_tokens 
      SET used = TRUE, updated_at = NOW()
      WHERE token = ${token}
    `;
    
    console.log('✅ Reset token marked as used:', token.substring(0, 8) + '...');
    return { success: true };
    
  } catch (error) {
    console.error('❌ Error marking token as used:', error);
    console.error('❌ Error details:', {
      message: error.message,
      code: error.code,
      detail: error.detail,
      token: token.substring(0, 8) + '...'
    });
    return { success: false, error: error.message };
  }
}

export async function cleanupExpiredTokens() {
  try {
    if (!process.env.POSTGRES_URL) {
      return { success: true, fallback: true };
    }

    console.log('🧹 Cleaning up expired reset tokens...');

    const result = await sql`
      DELETE FROM reset_tokens 
      WHERE expires_at < NOW() OR used = TRUE
    `;
    
    console.log('✅ Cleaned up expired reset tokens:', result.count);
    return { success: true, cleaned: result.count };
    
  } catch (error) {
    console.error('❌ Error cleaning up tokens:', error);
    console.error('❌ Error details:', {
      message: error.message,
      code: error.code,
      detail: error.detail
    });
    return { success: false, error: error.message };
  }
}

// Admin user management
export async function createAdminUser(data) {
  if (!isDbAvailable()) {
    console.log('⚠️  Database not available, cannot create admin user');
    return { success: false, error: 'Database not available' };
  }
  
  try {
    console.log('🔍 Creating admin user:', data.email);

    // Check if email already exists in admin_users
    const existingAdmin = await sql`
      SELECT username, email FROM admin_users 
      WHERE username = ${data.username} OR email = ${data.email}
    `;

    if (existingAdmin.rows.length > 0) {
      const existing = existingAdmin.rows[0];
      const field = existing.username === data.username ? 'username' : 'email';
      return { 
        success: false, 
        error: `Admin ${field} already exists` 
      };
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 12);
    console.log('🔐 Password hashed for admin:', data.username);

    // Eerst controleren of de email kolom bestaat in admin_users
    try {
      await sql`SELECT email FROM admin_users LIMIT 1`;
    } catch (columnError) {
      if (columnError.message.includes('column "email" does not exist')) {
        console.log('🔧 Adding email column to admin_users table...');
        await sql`ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS email VARCHAR(255)`;
        console.log('✅ Email column added to admin_users table');
      }
    }

    // Create admin user
    const result = await sql`
      INSERT INTO admin_users (
        username, email, password_hash, role
      ) VALUES (
        ${data.username}, ${data.email}, ${hashedPassword}, ${data.role || 'admin'}
      )
      RETURNING username, email, role, created_at
    `;

    if (result.rows.length > 0) {
      console.log('✅ Admin user created successfully:', data.username);
      return { 
        success: true, 
        data: result.rows[0],
        message: `Admin user ${data.username} created successfully`
      };
    } else {
      return { success: false, error: 'Failed to create admin user' };
    }

  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    console.error('❌ Error details:', {
      message: error.message,
      code: error.code,
      detail: error.detail,
      username: data.username,
      email: data.email
    });
    return { success: false, error: error.message };
  }
}

module.exports = {
  query,
  initializeDatabase,
  getInfluencer,
  getAllInfluencers,
  createInfluencer,
  updateInfluencer,
  deleteInfluencer,
  getSetting,
  setSetting,
  getInfluencerByEmail,
  updateInfluencerPassword,
  saveResetToken,
  getResetToken,
  markResetTokenAsUsed,
  cleanupExpiredTokens,
  createAdminUser
};