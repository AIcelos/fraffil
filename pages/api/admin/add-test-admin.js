import { sql } from '@vercel/postgres';
import bcrypt from 'bcryptjs';

export default async function handler(req, res) {
  try {
    console.log('🔧 Adding test admin...');

    // Ensure admin_users table exists
    await sql`
      CREATE TABLE IF NOT EXISTS admin_users (
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

    // Add missing columns if they don't exist
    try {
      await sql`ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS email VARCHAR(255)`;
      await sql`ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active'`;
      await sql`ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS created_by VARCHAR(50)`;
      await sql`ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS notes TEXT`;
    } catch (error) {
      // Columns might already exist
    }

    // Create test admin
    const testUsername = 'testadmin';
    const testPassword = 'admin123';
    const testEmail = 'testadmin@filright.com';

    // Check if already exists
    const existing = await sql`
      SELECT username FROM admin_users 
      WHERE username = ${testUsername}
      LIMIT 1
    `;

    if (existing.rows.length > 0) {
      return res.status(200).json({
        success: true,
        message: 'Test admin already exists',
        username: testUsername,
        note: 'Use existing credentials'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(testPassword, 12);

    // Create admin
    const result = await sql`
      INSERT INTO admin_users (
        username, password_hash, email, role, status, created_by, notes
      ) VALUES (
        ${testUsername}, ${hashedPassword}, ${testEmail}, 
        'admin', 'active', 'system', 'Test admin created via API'
      ) RETURNING id, username, email, role, status, created_at
    `;

    const newAdmin = result.rows[0];

    // Get all admins to show current state
    const allAdmins = await sql`
      SELECT id, username, email, role, status, created_at, created_by
      FROM admin_users 
      ORDER BY created_at DESC
    `;

    console.log('✅ Test admin created:', newAdmin);

    return res.status(200).json({
      success: true,
      message: 'Test admin created successfully',
      newAdmin: newAdmin,
      credentials: {
        username: testUsername,
        password: testPassword,
        email: testEmail
      },
      allAdmins: allAdmins.rows,
      totalAdmins: allAdmins.rows.length
    });

  } catch (error) {
    console.error('❌ Error adding test admin:', error);
    
    return res.status(500).json({
      success: false,
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
} 