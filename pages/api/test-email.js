import { emailService } from '../../lib/email.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { type, email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    console.log(`🧪 Testing ${type} email to: ${email}`);

    let result;

    switch (type) {
      case 'welcome':
        result = await emailService.sendWelcomeEmail(
          email,
          'Test Gebruiker',
          'testuser',
          'TempPass123!'
        );
        break;

      case 'sale':
        result = await emailService.sendSaleNotification(
          email,
          'Test Gebruiker',
          {
            orderId: 'TEST001',
            amount: 299.99,
            commission: 17.99,
            product: 'FilRight Premium Product',
            date: new Date().toISOString()
          }
        );
        break;

      case 'weekly':
        result = await emailService.sendWeeklyReport(
          email,
          'Test Gebruiker',
          {
            totalSales: 5,
            totalRevenue: '1,247.50',
            totalCommission: '74.85',
            period: '11 - 17 Juni 2025',
            topProducts: [
              {
                name: 'FilRight Premium',
                sales: 3,
                revenue: '897.50',
                commission: '53.85'
              },
              {
                name: 'FilRight Basic',
                sales: 2,
                revenue: '350.00',
                commission: '21.00'
              }
            ]
          }
        );
        break;

      case 'password-reset':
        result = await emailService.sendPasswordReset(
          email,
          'Test Gebruiker',
          'test-reset-token-123456789'
        );
        break;

      default:
        return res.status(400).json({ error: 'Invalid email type. Use: welcome, sale, weekly, or password-reset' });
    }

    if (result.success) {
      console.log(`✅ ${type} email test successful:`, result.messageId);
      res.status(200).json({
        success: true,
        message: `${type} email sent successfully`,
        messageId: result.messageId,
        type: type
      });
    } else {
      console.error(`❌ ${type} email test failed:`, result.error);
      res.status(500).json({
        success: false,
        error: result.error,
        type: type
      });
    }

  } catch (error) {
    console.error('❌ Email test exception:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

// Example usage:
/*
POST /api/test-email
{
  "type": "welcome",
  "email": "test@example.com"
}

POST /api/test-email
{
  "type": "sale",
  "email": "influencer@example.com"
}

POST /api/test-email
{
  "type": "weekly",
  "email": "test@example.com"
}

POST /api/test-email
{
  "type": "password-reset",
  "email": "test@example.com"
}
*/ 