import { getInfluencer, getAllInfluencers } from '../../lib/database.js';
import bcrypt from 'bcryptjs';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { username, testPassword } = req.query;

    console.log('🔍 Debug user request for:', username);

    if (username) {
      // Debug specific user
      const user = await getInfluencer(username);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found',
          username: username
        });
      }

      const debugInfo = {
        success: true,
        user: {
          ref: user.ref,
          name: user.name,
          email: user.email,
          status: user.status,
          hasPassword: !!user.password,
          passwordLength: user.password ? user.password.length : 0,
          passwordPreview: user.password ? user.password.substring(0, 20) + '...' : 'NO PASSWORD',
          commission: user.commission,
          created_at: user.created_at,
          updated_at: user.updated_at
        }
      };

      // Test password if provided
      if (testPassword && user.password) {
        try {
          const isValid = await bcrypt.compare(testPassword, user.password);
          debugInfo.passwordTest = {
            testPassword: testPassword,
            isValid: isValid,
            message: isValid ? 'Password matches!' : 'Password does not match'
          };
        } catch (error) {
          debugInfo.passwordTest = {
            testPassword: testPassword,
            error: error.message
          };
        }
      }

      return res.status(200).json(debugInfo);
    } else {
      // List all users
      const users = await getAllInfluencers();
      
      const userList = users.map(user => ({
        ref: user.ref,
        name: user.name,
        email: user.email,
        status: user.status,
        hasPassword: !!user.password,
        passwordLength: user.password ? user.password.length : 0,
        created_at: user.created_at
      }));

      return res.status(200).json({
        success: true,
        totalUsers: userList.length,
        users: userList
      });
    }

  } catch (error) {
    console.error('❌ Debug user error:', error);
    
    return res.status(500).json({
      success: false,
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
} 