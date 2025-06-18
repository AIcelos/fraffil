const { sql } = require('@vercel/postgres');
const bcrypt = require('bcryptjs');

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    console.log('🚀 Creating admin user for sven@filright.com...');
    
    // Check database availability
    if (!process.env.POSTGRES_URL) {
      return res.status(500).json({
        success: false,
        error: 'Database not configured'
      });
    }

    if (req.method === 'GET') {
      return res.status(200).json({
        success: true,
        message: 'API is ready to create admin user',
        instructions: 'Send POST request to create admin user'
      });
    }

    if (req.method !== 'POST') {
      return res.status(405).json({
        success: false,
        error: 'Method not allowed'
      });
    }

    // Check if admin user already exists
    const existingAdmin = await sql`
      SELECT username, email FROM admin_users 
      WHERE username = 'sven' OR email = 'sven@filright.com'
    `;

    if (existingAdmin.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Admin user already exists',
        message: 'User sven@filright.com already exists in the system'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash('temp123456', 12);
    console.log('🔐 Password hashed for admin: sven');

    // Check if email column exists in admin_users table
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
        'sven', 'sven@filright.com', ${hashedPassword}, 'admin'
      )
      RETURNING username, email, role, created_at
    `;

    if (result.rows.length > 0) {
      console.log('✅ Admin user created successfully: sven');
      
      res.status(201).json({
        success: true,
        message: 'Admin user created successfully!',
        data: {
          username: result.rows[0].username,
          email: result.rows[0].email,
          role: result.rows[0].role,
          created_at: result.rows[0].created_at
        },
        nextSteps: [
          '1. Go to: https://fraffil.vercel.app/forgot-password',
          '2. Enter email: sven@filright.com',
          '3. Check your email for reset link',
          '4. Set your new password',
          '5. Login at: https://fraffil.vercel.app/admin/login'
        ]
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to create admin user'
      });
    }

  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    
    res.status(500).json({
      success: false,
      error: 'Server error',
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
} 