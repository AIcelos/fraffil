import { createAdminUser } from '../../../lib/database.js';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }

  try {
    console.log('🚀 Creating admin user via API...');
    
    // Hardcoded voor veiligheid - alleen voor Sven
    const adminData = {
      email: 'sven@filright.com',
      username: 'sven',
      password: 'temp123456', // Tijdelijk wachtwoord
      role: 'admin'
    };

    const result = await createAdminUser(adminData);

    if (result.success) {
      console.log('✅ Admin user created successfully via API');
      
      res.status(201).json({
        success: true,
        message: 'Admin user created successfully',
        data: {
          username: result.data.username,
          email: result.data.email,
          role: result.data.role,
          created_at: result.data.created_at
        },
        instructions: {
          step1: 'Go to: https://fraffil.vercel.app/forgot-password',
          step2: 'Enter email: sven@filright.com',
          step3: 'Check your email for reset link',
          step4: 'Set your new password',
          step5: 'Login at: https://fraffil.vercel.app/admin/login'
        }
      });
    } else {
      console.error('❌ Failed to create admin user:', result.error);
      
      res.status(400).json({
        success: false,
        error: result.error,
        message: 'Failed to create admin user'
      });
    }

  } catch (error) {
    console.error('❌ API error creating admin user:', error);
    
    res.status(500).json({
      success: false,
      error: 'Server error',
      message: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
} 