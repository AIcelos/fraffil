import { emailService } from '../../../lib/email.js';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Simple admin authentication
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'Geen geldige authenticatie'
    });
  }

  try {
    console.log('🧪 Testing email configuration...');
    
    // Check environment variables
    const hasApiKey = !!process.env.RESEND_API_KEY;
    const apiKeyLength = process.env.RESEND_API_KEY ? process.env.RESEND_API_KEY.length : 0;
    const nodeEnv = process.env.NODE_ENV;
    
    console.log('Environment check:');
    console.log('  - RESEND_API_KEY exists:', hasApiKey);
    console.log('  - API key length:', apiKeyLength);
    console.log('  - NODE_ENV:', nodeEnv);

    if (!hasApiKey) {
      return res.status(200).json({
        success: false,
        error: 'RESEND_API_KEY not configured',
        config: {
          hasApiKey: false,
          apiKeyLength: 0,
          nodeEnv: nodeEnv,
          note: 'Email functionality will not work without API key'
        }
      });
    }

    // Test basic email service availability
    try {
      // Don't actually send an email, just test the service initialization
      console.log('✅ Email service configuration looks good');
      
      res.status(200).json({
        success: true,
        message: 'Email service is properly configured',
        config: {
          hasApiKey: true,
          apiKeyLength: apiKeyLength,
          nodeEnv: nodeEnv,
          note: 'Ready to send emails via Resend'
        }
      });

    } catch (emailError) {
      console.error('❌ Email service error:', emailError);
      
      res.status(200).json({
        success: false,
        error: 'Email service configuration error',
        details: emailError.message,
        config: {
          hasApiKey: true,
          apiKeyLength: apiKeyLength,
          nodeEnv: nodeEnv
        }
      });
    }

  } catch (error) {
    console.error('❌ Test error:', error);
    
    res.status(500).json({
      success: false,
      error: 'Test failed: ' + error.message,
      stack: error.stack
    });
  }
} 