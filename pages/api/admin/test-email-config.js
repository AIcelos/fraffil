import { emailService } from '../../../lib/email.js';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { template, testData } = req.body;

    console.log('📧 Testing email template:', template, testData);

    // Validatie
    if (!template) {
      return res.status(400).json({
        success: false,
        error: 'Template type is required'
      });
    }

    // Test email versturen op basis van template type
    let emailResult;
    
    switch (template) {
      case 'welcome':
        emailResult = await emailService.sendWelcomeEmail(
          testData.email || 'test@example.com',
          testData.name || 'Test Gebruiker',
          testData.username || 'testuser123',
          testData.password || 'testpass123',
          testData.loginUrl || 'https://affiliate.filright.com/dashboard/login'
        );
        break;
        
      case 'sale':
        emailResult = await emailService.sendSaleNotification(
          testData.email || 'test@example.com',
          testData.name || 'Test Gebruiker',
          testData.orderId || 'ORD-2024-001',
          testData.amount || 149.99,
          testData.commission || 14.99,
          testData.totalEarnings || 234.56
        );
        break;
        
      case 'weekly':
        emailResult = await emailService.sendWeeklyReport(
          testData.email || 'test@example.com',
          testData.name || 'Test Gebruiker',
          testData.weekNumber || 25,
          testData.totalSales || 1247.89,
          testData.totalCommission || 124.79,
          testData.topProducts || ['Product A', 'Product B', 'Product C']
        );
        break;
        
      case 'passwordReset':
        emailResult = await emailService.sendPasswordResetEmail(
          testData.email || 'test@example.com',
          testData.name || 'Test Gebruiker',
          testData.resetUrl || 'https://affiliate.filright.com/reset-password?token=test123',
          testData.expiryTime || '1 uur'
        );
        break;
        
      default:
        return res.status(400).json({
          success: false,
          error: 'Unknown template type'
        });
    }

    if (emailResult.success) {
      return res.status(200).json({
        success: true,
        message: `Test email verstuurd voor ${template} template`,
        template,
        testData
      });
    } else {
      return res.status(500).json({
        success: false,
        error: emailResult.error || 'Failed to send test email'
      });
    }

  } catch (error) {
    console.error('❌ Error testing email template:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error: ' + error.message
    });
  }
} 