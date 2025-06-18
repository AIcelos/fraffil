import { getInfluencer } from '../../lib/database.js';
import bcrypt from 'bcryptjs';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { username, password } = req.body;

  try {
    console.log('🔍 Debug login for:', username);

    // Test 1: Check if user exists
    const influencer = await getInfluencer(username);
    
    if (!influencer) {
      return res.status(200).json({
        step: 1,
        error: 'User not found',
        username: username,
        success: false
      });
    }

    // Test 2: Check user data
    const userInfo = {
      step: 2,
      found: true,
      username: influencer.ref,
      name: influencer.name,
      email: influencer.email,
      status: influencer.status,
      hasPassword: !!influencer.password,
      passwordLength: influencer.password ? influencer.password.length : 0,
      passwordPreview: influencer.password ? influencer.password.substring(0, 20) + '...' : 'NO PASSWORD'
    };

    // Test 3: Check status
    if (influencer.status !== 'active') {
      return res.status(200).json({
        ...userInfo,
        step: 3,
        error: 'Account not active',
        actualStatus: influencer.status,
        success: false
      });
    }

    // Test 4: Check password
    if (!influencer.password) {
      return res.status(200).json({
        ...userInfo,
        step: 4,
        error: 'No password set',
        success: false
      });
    }

    // Test 5: Test password verification
    try {
      const isValidPassword = await bcrypt.compare(password, influencer.password);
      
      return res.status(200).json({
        ...userInfo,
        step: 5,
        passwordTest: {
          provided: password,
          isValid: isValidPassword,
          message: isValidPassword ? 'Password matches!' : 'Password does not match'
        },
        success: isValidPassword
      });
    } catch (bcryptError) {
      return res.status(200).json({
        ...userInfo,
        step: 5,
        error: 'bcrypt error',
        bcryptError: bcryptError.message,
        success: false
      });
    }

  } catch (error) {
    console.error('❌ Debug login error:', error);
    
    return res.status(200).json({
      step: 0,
      error: 'Server error',
      details: error.message,
      success: false
    });
  }
} 