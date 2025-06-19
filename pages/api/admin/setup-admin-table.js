import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  try {
    console.log('🔧 Setting up admin_users table...');

    // First, check if table exists and what columns it has
    let tableExists = false;
    let existingColumns = [];

    try {
      const tableCheck = await sql`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'admin_users'
        ORDER BY ordinal_position
      `;
      
      if (tableCheck.rows.length > 0) {
        tableExists = true;
        existingColumns = tableCheck.rows.map(row => ({
          name: row.column_name,
          type: row.data_type,
          nullable: row.is_nullable
        }));
      }
    } catch (error) {
      console.log('📋 Table does not exist yet');
    }

    console.log('📊 Table exists:', tableExists);
    console.log('📋 Existing columns:', existingColumns);

    // Create table if it doesn't exist
    if (!tableExists) {
      console.log('🏗️ Creating admin_users table...');
      await sql`
        CREATE TABLE admin_users (
          id SERIAL PRIMARY KEY,
          username VARCHAR(50) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          email VARCHAR(255),
          role VARCHAR(20) DEFAULT 'admin',
          status VARCHAR(20) DEFAULT 'active',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          created_by VARCHAR(50),
          last_login TIMESTAMP,
          notes TEXT
        )
      `;
      console.log('✅ Table created successfully');
    } else {
      console.log('📋 Table exists, checking for missing columns...');
      
      // Check and add missing columns
      const requiredColumns = [
        { name: 'email', sql: 'ALTER TABLE admin_users ADD COLUMN email VARCHAR(255)' },
        { name: 'role', sql: 'ALTER TABLE admin_users ADD COLUMN role VARCHAR(20) DEFAULT \'admin\'' },
        { name: 'status', sql: 'ALTER TABLE admin_users ADD COLUMN status VARCHAR(20) DEFAULT \'active\'' },
        { name: 'created_by', sql: 'ALTER TABLE admin_users ADD COLUMN created_by VARCHAR(50)' },
        { name: 'last_login', sql: 'ALTER TABLE admin_users ADD COLUMN last_login TIMESTAMP' },
        { name: 'notes', sql: 'ALTER TABLE admin_users ADD COLUMN notes TEXT' }
      ];

      const missingColumns = [];
      const addedColumns = [];

      for (const required of requiredColumns) {
        const exists = existingColumns.some(col => col.name === required.name);
        if (!exists) {
          missingColumns.push(required.name);
          try {
            await sql.unsafe(required.sql);
            addedColumns.push(required.name);
            console.log(`✅ Added column: ${required.name}`);
          } catch (error) {
            console.error(`❌ Failed to add column ${required.name}:`, error.message);
          }
        }
      }

      console.log('📊 Missing columns found:', missingColumns);
      console.log('✅ Columns added:', addedColumns);
    }

    // Verify final table structure
    const finalColumns = await sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'admin_users'
      ORDER BY ordinal_position
    `;

    // Get current admin users
    const currentAdmins = await sql`
      SELECT id, username, 
             COALESCE(email, 'No email') as email,
             COALESCE(role, 'admin') as role,
             COALESCE(status, 'active') as status,
             created_at
      FROM admin_users 
      ORDER BY created_at DESC
    `;

    // Create indexes for better performance
    try {
      await sql`CREATE INDEX IF NOT EXISTS idx_admin_username ON admin_users(username)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_admin_email ON admin_users(email)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_admin_status ON admin_users(status)`;
      console.log('✅ Indexes created');
    } catch (error) {
      console.log('⚠️ Index creation failed:', error.message);
    }

    return res.status(200).json({
      success: true,
      message: 'Admin table setup completed',
      tableInfo: {
        existed: tableExists,
        columns: finalColumns.rows,
        totalColumns: finalColumns.rows.length
      },
      currentAdmins: {
        count: currentAdmins.rows.length,
        users: currentAdmins.rows
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Admin table setup error:', error);
    
    return res.status(500).json({
      success: false,
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
} 