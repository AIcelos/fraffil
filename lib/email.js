import { Resend } from 'resend';

// Initialize Resend with API key
const resend = new Resend(process.env.RESEND_API_KEY);

// Email configuration
const EMAIL_CONFIG = {
  from: 'Filright <noreply@filright.com>',
  replyTo: 'support@filright.com',
  domain: process.env.NODE_ENV === 'production' ? 'https://fraffil.vercel.app' : 'http://localhost:3000'
};

/**
 * Send welcome email to new influencer
 */
export async function sendWelcomeEmail(influencerData) {
  try {
    const { email, name, username, tempPassword } = influencerData;

    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welkom bij Filright!</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: white; padding: 30px; border: 1px solid #e1e5e9; }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; color: #6c757d; font-size: 14px; }
        .button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
        .credentials { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea; }
        .highlight { color: #667eea; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Welkom bij Filright!</h1>
          <p>Je affiliate account is klaar voor gebruik</p>
        </div>
        
        <div class="content">
          <h2>Hallo ${name || username}! 👋</h2>
          
          <p>Fantastisch dat je onderdeel wordt van het Filright affiliate programma! Je account is succesvol aangemaakt en je kunt nu beginnen met het verdienen van commissies.</p>
          
          <div class="credentials">
            <h3>🔐 Je Login Gegevens:</h3>
            <p><strong>Dashboard URL:</strong> <a href="${EMAIL_CONFIG.domain}/dashboard/login">${EMAIL_CONFIG.domain}/dashboard/login</a></p>
            <p><strong>Gebruikersnaam:</strong> <span class="highlight">${username}</span></p>
            <p><strong>Tijdelijk Wachtwoord:</strong> <span class="highlight">${tempPassword}</span></p>
            <p><em>⚠️ Verander je wachtwoord na je eerste login voor de veiligheid!</em></p>
          </div>
          
          <div style="text-align: center;">
            <a href="${EMAIL_CONFIG.domain}/dashboard/login" class="button">🚀 Login naar Dashboard</a>
          </div>
          
          <h3>🎯 Wat kun je nu doen?</h3>
          <ul>
            <li><strong>Dashboard bekijken</strong> - Zie je real-time verkoop statistieken</li>
            <li><strong>Referral link krijgen</strong> - Jouw persoonlijke affiliate link</li>
            <li><strong>Commissies tracken</strong> - Verdien geld met elke verkoop</li>
            <li><strong>Profiel aanvullen</strong> - Voeg je sociale media accounts toe</li>
          </ul>
          
          <h3>💰 Commissie Informatie</h3>
          <p>Je verdient <span class="highlight">commissie op elke verkoop</span> die via jouw referral link binnenkomt. Je kunt je verdiensten real-time volgen in het dashboard.</p>
          
          <h3>📞 Hulp Nodig?</h3>
          <p>Als je vragen hebt, stuur dan een email naar <a href="mailto:support@filright.com">support@filright.com</a> of login in je dashboard voor meer informatie.</p>
          
          <p>Veel succes met affiliate marketing! 🚀</p>
          
          <p>Met vriendelijke groet,<br><strong>Het Filright Team</strong></p>
        </div>
        
        <div class="footer">
          <p>© 2025 Filright - Affiliate Marketing Platform</p>
          <p>Deze email is verstuurd naar ${email}</p>
        </div>
      </div>
    </body>
    </html>`;

    const result = await resend.emails.send({
      from: EMAIL_CONFIG.from,
      to: email,
      subject: '🎉 Welkom bij Filright - Je account is klaar!',
      html: htmlContent,
      replyTo: EMAIL_CONFIG.replyTo
    });

    console.log('✅ Welcome email sent successfully:', result.id);
    return { success: true, messageId: result.id };

  } catch (error) {
    console.error('❌ Error sending welcome email:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send sale notification email to influencer
 */
export async function sendSaleNotificationEmail(influencerData, saleData) {
  try {
    const { email, name, username } = influencerData;
    const { orderId, amount, commission, commissionAmount } = saleData;

    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Nieuwe Verkoop! 🎉</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: white; padding: 30px; border: 1px solid #e1e5e9; }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; color: #6c757d; font-size: 14px; }
        .sale-details { background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981; }
        .commission-highlight { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0; }
        .button { display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
        .highlight { color: #10b981; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Nieuwe Verkoop!</h1>
          <p>Je hebt zojuist commissie verdiend</p>
        </div>
        
        <div class="content">
          <h2>Gefeliciteerd ${name || username}! 🎊</h2>
          
          <p>Er is zojuist een verkoop gerealiseerd via jouw referral link. Hier zijn de details:</p>
          
          <div class="sale-details">
            <h3>📦 Verkoop Details</h3>
            <p><strong>Order ID:</strong> ${orderId}</p>
            <p><strong>Verkoop Bedrag:</strong> €${amount.toFixed(2)}</p>
            <p><strong>Commissie Percentage:</strong> ${commission}%</p>
          </div>
          
          <div class="commission-highlight">
            <h2>💰 Je Commissie: €${commissionAmount.toFixed(2)}</h2>
            <p>Deze commissie is toegevoegd aan je totale verdiensten!</p>
          </div>
          
          <div style="text-align: center;">
            <a href="${EMAIL_CONFIG.domain}/dashboard" class="button">📊 Bekijk Dashboard</a>
          </div>
          
          <h3>🚀 Blijf Promoten!</h3>
          <p>Dit is pas het begin! Blijf je referral link delen om meer commissies te verdienen. Elke verkoop telt!</p>
          
          <h3>📈 Tips voor Meer Verkopen</h3>
          <ul>
            <li>Deel je link op verschillende sociale media platforms</li>
            <li>Vertel over je eigen ervaring met de producten</li>
            <li>Post op momenten wanneer je audience actief is</li>
            <li>Gebruik aantrekkelijke visuals en verhalen</li>
          </ul>
          
          <p>Blijf zo doorgaan! 💪</p>
          
          <p>Met vriendelijke groet,<br><strong>Het Filright Team</strong></p>
        </div>
        
        <div class="footer">
          <p>© 2025 Filright - Affiliate Marketing Platform</p>
          <p>Deze email is verstuurd naar ${email}</p>
        </div>
      </div>
    </body>
    </html>`;

    const result = await resend.emails.send({
      from: EMAIL_CONFIG.from,
      to: email,
      subject: `🎉 Nieuwe Verkoop! €${commissionAmount.toFixed(2)} commissie verdiend`,
      html: htmlContent,
      replyTo: EMAIL_CONFIG.replyTo
    });

    console.log('✅ Sale notification email sent successfully:', result.id);
    return { success: true, messageId: result.id };

  } catch (error) {
    console.error('❌ Error sending sale notification email:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send weekly performance report
 */
export async function sendWeeklyReport(influencerData, weeklyStats) {
  try {
    const { email, name, username } = influencerData;
    const { totalSales, totalRevenue, totalCommission, topProducts, weekStart, weekEnd } = weeklyStats;

    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Wekelijks Rapport</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: white; padding: 30px; border: 1px solid #e1e5e9; }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; color: #6c757d; font-size: 14px; }
        .stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0; }
        .stat-card { background: #f8fafc; padding: 15px; border-radius: 8px; text-align: center; }
        .stat-value { font-size: 24px; font-weight: bold; color: #3b82f6; }
        .button { display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📊 Wekelijks Rapport</h1>
          <p>${weekStart} - ${weekEnd}</p>
        </div>
        
        <div class="content">
          <h2>Hallo ${name || username}! 👋</h2>
          
          <p>Hier is je wekelijkse performance overzicht:</p>
          
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-value">${totalSales}</div>
              <div>Verkopen</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">€${totalRevenue.toFixed(2)}</div>
              <div>Omzet</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">€${totalCommission.toFixed(2)}</div>
              <div>Commissie</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">€${(totalRevenue / Math.max(totalSales, 1)).toFixed(2)}</div>
              <div>Gem. Order</div>
            </div>
          </div>
          
          ${topProducts && topProducts.length > 0 ? `
          <h3>🏆 Top Producten</h3>
          <ul>
            ${topProducts.map(product => `<li>${product.name} - ${product.sales} verkopen</li>`).join('')}
          </ul>
          ` : ''}
          
          <div style="text-align: center;">
            <a href="${EMAIL_CONFIG.domain}/dashboard" class="button">📊 Volledig Dashboard</a>
          </div>
          
          <p>Blijf zo doorgaan en deel je link om nog meer te verdienen!</p>
          
          <p>Met vriendelijke groet,<br><strong>Het Filright Team</strong></p>
        </div>
        
        <div class="footer">
          <p>© 2025 Filright - Affiliate Marketing Platform</p>
        </div>
      </div>
    </body>
    </html>`;

    const result = await resend.emails.send({
      from: EMAIL_CONFIG.from,
      to: email,
      subject: `📊 Je wekelijkse rapport - €${totalCommission.toFixed(2)} verdiend`,
      html: htmlContent,
      replyTo: EMAIL_CONFIG.replyTo
    });

    console.log('✅ Weekly report email sent successfully:', result.id);
    return { success: true, messageId: result.id };

  } catch (error) {
    console.error('❌ Error sending weekly report email:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(email, resetToken, username) {
  try {
    const resetUrl = `${EMAIL_CONFIG.domain}/dashboard/reset-password?token=${resetToken}`;

    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Wachtwoord Reset</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: white; padding: 30px; border: 1px solid #e1e5e9; }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; color: #6c757d; font-size: 14px; }
        .button { display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
        .warning { background: #fef3c7; padding: 15px; border-radius: 8px; border-left: 4px solid #f59e0b; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔐 Wachtwoord Reset</h1>
          <p>Verzoek om wachtwoord te wijzigen</p>
        </div>
        
        <div class="content">
          <h2>Hallo ${username}! 👋</h2>
          
          <p>Je hebt een verzoek ingediend om je wachtwoord te resetten. Klik op de knop hieronder om een nieuw wachtwoord in te stellen:</p>
          
          <div style="text-align: center;">
            <a href="${resetUrl}" class="button">🔑 Nieuw Wachtwoord Instellen</a>
          </div>
          
          <div class="warning">
            <p><strong>⚠️ Belangrijk:</strong></p>
            <ul>
              <li>Deze link is 1 uur geldig</li>
              <li>Als je dit verzoek niet hebt gedaan, negeer deze email</li>
              <li>Je huidige wachtwoord blijft werken tot je een nieuw instelt</li>
            </ul>
          </div>
          
          <p>Als de knop niet werkt, kopieer dan deze link naar je browser:</p>
          <p style="word-break: break-all; color: #6b7280; font-size: 14px;">${resetUrl}</p>
          
          <p>Heb je vragen? Stuur een email naar <a href="mailto:support@filright.com">support@filright.com</a></p>
          
          <p>Met vriendelijke groet,<br><strong>Het Filright Team</strong></p>
        </div>
        
        <div class="footer">
          <p>© 2025 Filright - Affiliate Marketing Platform</p>
          <p>Deze email is verstuurd naar ${email}</p>
        </div>
      </div>
    </body>
    </html>`;

    const result = await resend.emails.send({
      from: EMAIL_CONFIG.from,
      to: email,
      subject: '🔐 Wachtwoord Reset - Filright',
      html: htmlContent,
      replyTo: EMAIL_CONFIG.replyTo
    });

    console.log('✅ Password reset email sent successfully:', result.id);
    return { success: true, messageId: result.id };

  } catch (error) {
    console.error('❌ Error sending password reset email:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Test email configuration
 */
export async function testEmailService() {
  try {
    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY environment variable is not set');
    }

    // Test email sending
    const result = await resend.emails.send({
      from: EMAIL_CONFIG.from,
      to: 'test@example.com',
      subject: 'Test Email - Filright',
      html: '<p>This is a test email from Filright affiliate system.</p>'
    });

    return { success: true, message: 'Email service is configured correctly', result };
  } catch (error) {
    return { success: false, error: error.message };
  }
} 