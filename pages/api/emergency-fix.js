import { sql } from '@vercel/postgres';
import bcrypt from 'bcryptjs';

export default async function handler(req, res) {
  try {
    console.log('🚨 Emergency database fix starting...');

    // Step 1: Check if password column exists
    let hasPasswordColumn = false;
    try {
      await sql`SELECT password FROM influencers LIMIT 1`;
      hasPasswordColumn = true;
      console.log('✅ Password column exists');
    } catch (error) {
      console.log('❌ Password column does not exist, adding it...');
      await sql`ALTER TABLE influencers ADD COLUMN password VARCHAR(255)`;
      console.log('✅ Password column added');
      hasPasswordColumn = true;
    }

    // Step 2: Create a working user with proper password
    const hashedPassword = await bcrypt.hash('test123', 12);
    
    // Delete existing emergency user if exists
    await sql`DELETE FROM influencers WHERE ref = 'emergency'`;
    
    // Create new emergency user
    const result = await sql`
      INSERT INTO influencers (
        ref, name, email, phone, instagram, tiktok, youtube,
        commission, status, notes, password
      ) VALUES (
        'emergency', 'Emergency User', 'emergency@test.com', 
        '', '', '', '', 6.00, 'active', 'Emergency fix user', ${hashedPassword}
      ) RETURNING ref, name, email, status
    `;

    // Step 3: Test the password
    const testResult = await bcrypt.compare('test123', hashedPassword);

    // Step 4: Verify the user was created with password
    const checkUser = await sql`
      SELECT ref, name, email, 
             CASE 
               WHEN password IS NULL THEN 'NULL'
               WHEN password = '' THEN 'EMPTY'
               WHEN LENGTH(password) > 50 THEN 'HASHED'
               ELSE 'PLAIN'
             END as password_status,
             LENGTH(password) as password_length
      FROM influencers 
      WHERE ref = 'emergency'
    `;

    return res.status(200).json({
      success: true,
      message: 'Emergency fix completed successfully!',
      steps: {
        passwordColumnAdded: !hasPasswordColumn,
        userCreated: result.rows[0],
        passwordTest: testResult,
        userVerification: checkUser.rows[0]
      },
      credentials: {
        username: 'emergency',
        password: 'test123',
        note: 'Use these credentials to login now!'
      }
    });

  } catch (error) {
    console.error('❌ Emergency fix failed:', error);
    
    return res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
} 