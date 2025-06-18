import { testEmailService } from '../../lib/email.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🔍 Testing email configuration...');
    
    // Check environment variables
    const hasApiKey = !!process.env.RESEND_API_KEY;
    const apiKeyLength = process.env.RESEND_API_KEY ? process.env.RESEND_API_KEY.length : 0;
    
    console.log('📧 Email config check:');
    console.log('  - RESEND_API_KEY exists:', hasApiKey);
    console.log('  - API key length:', apiKeyLength);
    
    if (!hasApiKey) {
      return res.status(500).json({
        success: false,
        error: 'RESEND_API_KEY not configured',
        details: {
          hasApiKey: false,
          apiKeyLength: 0
        }
      });
    }

    // Test email service
    const testResult = await testEmailService();
    
    return res.json({
      success: true,
      message: 'Email service configuration check complete',
      details: {
        hasApiKey: true,
        apiKeyLength: apiKeyLength,
        serviceTest: testResult,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Email config test error:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      details: {
        hasApiKey: !!process.env.RESEND_API_KEY,
        timestamp: new Date().toISOString()
      }
    });
  }
} 