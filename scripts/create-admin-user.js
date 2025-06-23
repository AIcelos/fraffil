#!/usr/bin/env node

import { createAdminUser } from '../lib/database.js';

async function createSvenAdmin() {
  console.log('🚀 Creating admin user for sven@filright.com...');
  
  try {
    const result = await createAdminUser({
      email: 'sven@filright.com',
      username: 'sven',
      password: 'temp123456', // Tijdelijk wachtwoord - wordt via reset gewijzigd
      role: 'admin'
    });

    if (result.success) {
      console.log('✅ Admin user created successfully!');
      console.log('📧 Email: sven@filright.com');
      console.log('👤 Username: sven');
      console.log('🔑 Temporary password: temp123456');
      console.log('');
      console.log('🔄 Next steps:');
      console.log('1. Go to: https://affiliate.filright.com/forgot-password');
      console.log('2. Enter email: sven@filright.com');
      console.log('3. Check your email for reset link');
      console.log('4. Set your new password');
      console.log('5. Login at: https://affiliate.filright.com/admin/login');
    } else {
      console.error('❌ Failed to create admin user:', result.error);
    }
  } catch (error) {
    console.error('❌ Script error:', error.message);
  }
}

// Run the script
createSvenAdmin(); 