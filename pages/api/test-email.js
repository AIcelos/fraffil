import { sendWelcomeEmail, sendSaleNotificationEmail, testEmailService } from '../../lib/email.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { type, data } = req.body;

    console.log('📧 Email test request:', { type, hasData: !!data });

    switch (type) {
      case 'test':
        const testResult = await testEmailService();
        return res.json({
          success: testResult.success,
          message: testResult.success ? 'Email service is working!' : 'Email service failed',
          details: testResult
        });

      case 'welcome':
        if (!data || !data.email || !data.username) {
          return res.status(400).json({ 
            error: 'Missing required fields: email, username' 
          });
        }

        const welcomeData = {
          email: data.email,
          name: data.name || data.username,
          username: data.username,
          tempPassword: data.tempPassword || 'temp123456'
        };

        const welcomeResult = await sendWelcomeEmail(welcomeData);
        return res.json({
          success: welcomeResult.success,
          message: welcomeResult.success ? 'Welcome email sent!' : 'Failed to send welcome email',
          details: welcomeResult
        });

      case 'sale':
        if (!data || !data.influencer || !data.sale) {
          return res.status(400).json({ 
            error: 'Missing required fields: influencer, sale' 
          });
        }

        const saleResult = await sendSaleNotificationEmail(data.influencer, data.sale);
        return res.json({
          success: saleResult.success,
          message: saleResult.success ? 'Sale notification sent!' : 'Failed to send sale notification',
          details: saleResult
        });

      default:
        return res.status(400).json({ 
          error: 'Invalid email type. Use: test, welcome, or sale' 
        });
    }

  } catch (error) {
    console.error('❌ Email test error:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      details: error
    });
  }
}

// Example usage:
/*
POST /api/test-email
{
  "type": "test"
}

POST /api/test-email
{
  "type": "welcome",
  "data": {
    "email": "test@example.com",
    "username": "testuser",
    "name": "Test User",
    "tempPassword": "temp123456"
  }
}

POST /api/test-email
{
  "type": "sale",
  "data": {
    "influencer": {
      "email": "influencer@example.com",
      "name": "Test Influencer",
      "username": "testinfluencer"
    },
    "sale": {
      "orderId": "TEST001",
      "amount": 99.99,
      "commission": 6,
      "commissionAmount": 5.99
    }
  }
}
*/ 