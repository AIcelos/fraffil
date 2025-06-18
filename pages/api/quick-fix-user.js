import { sql } from '@vercel/postgres';
import bcrypt from 'bcryptjs';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🔧 Quick fix - creating working user');

    // Hash password directly
    const hashedPassword = await bcrypt.hash('welkom123', 12);
    console.log('🔐 Password hashed successfully');

    // Check if user exists and delete if necessary
    await sql`DELETE FROM influencers WHERE ref = 'quickfix'`;

    // Create user with proper hashed password
    const result = await sql`
      INSERT INTO influencers (
        ref, name, email, phone, instagram, tiktok, youtube,
        commission, status, notes, password
      ) VALUES (
        'quickfix', 'Quick Fix User', 'quickfix@test.com', 
        '', '', '', '', 6.00, 'active', 'Quick fix user', ${hashedPassword}
      ) RETURNING 
        ref, name, email, status, created_at
    `;

    console.log('✅ Quick fix user created:', result.rows[0]);

    // Test the password immediately
    const testPassword = await bcrypt.compare('welkom123', hashedPassword);
    console.log('🧪 Password test result:', testPassword);

    return res.status(200).json({
      success: true,
      message: 'Quick fix user created successfully',
      user: result.rows[0],
      credentials: {
        username: 'quickfix',
        password: 'welkom123'
      },
      passwordTest: testPassword
    });

  } catch (error) {
    console.error('❌ Quick fix error:', error);
    
    return res.status(500).json({
      success: false,
      error: error.message,
      details: error.stack
    });
  }
} 