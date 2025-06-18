import { Resend } from 'resend';

// Initialize Resend with API key (lazy loading voor development)
let resend = null;

function getResendClient() {
  if (!resend && process.env.RESEND_API_KEY) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
}

// Email configuration
const EMAIL_CONFIG = {
  from: 'Filright <noreply@filright.com>',
  replyTo: 'support@filright.com',
  domain: process.env.NODE_ENV === 'production' ? 'https://fraffil.vercel.app' : 'http://localhost:3000'
};

// Base template voor consistente styling
const getBaseTemplate = (content, preheader = '') => `
<!DOCTYPE html>
<html lang="nl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>FilRight</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            color: #1f2937;
            background-color: #f9fafb;
        }
        .container { 
            max-width: 600px; 
            margin: 0 auto; 
            background: white;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        .header { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 40px 30px;
            text-align: center;
        }
        .logo { 
            font-size: 32px; 
            font-weight: bold; 
            color: white;
            text-decoration: none;
            letter-spacing: -0.5px;
        }
        .content { 
            padding: 40px 30px;
        }
        .greeting { 
            font-size: 20px; 
            font-weight: 600; 
            margin-bottom: 20px;
            color: #1f2937;
        }
        .text { 
            margin-bottom: 20px; 
            color: #4b5563;
            font-size: 16px;
        }
        .button { 
            display: inline-block;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-decoration: none;
            padding: 16px 32px;
            border-radius: 8px;
            font-weight: 600;
            margin: 20px 0;
            transition: transform 0.2s;
        }
        .button:hover { transform: translateY(-1px); }
        .stats-grid { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); 
            gap: 20px; 
            margin: 30px 0;
        }
        .stat-card { 
            background: #f8fafc; 
            padding: 20px; 
            border-radius: 8px; 
            text-align: center;
            border-left: 4px solid #667eea;
        }
        .stat-number { 
            font-size: 24px; 
            font-weight: bold; 
            color: #1f2937;
        }
        .stat-label { 
            color: #6b7280; 
            font-size: 14px;
            margin-top: 4px;
        }
        .footer { 
            background: #f8fafc; 
            padding: 30px; 
            text-align: center; 
            border-top: 1px solid #e5e7eb;
        }
        .footer-text { 
            color: #6b7280; 
            font-size: 14px;
            margin-bottom: 10px;
        }
        .social-links a { 
            color: #667eea; 
            text-decoration: none; 
            margin: 0 10px;
        }
        .highlight { 
            background: linear-gradient(120deg, #a8edea 0%, #fed6e3 100%);
            padding: 2px 6px;
            border-radius: 4px;
            font-weight: 600;
        }
        .order-item {
            background: #f8fafc;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 16px;
            margin: 10px 0;
        }
        .order-id { font-weight: 600; color: #1f2937; }
        .order-amount { 
            font-size: 18px; 
            font-weight: bold; 
            color: #059669;
            float: right;
        }
        @media (max-width: 600px) {
            .container { margin: 0; border-radius: 0; }
            .header, .content, .footer { padding: 20px; }
            .stats-grid { grid-template-columns: 1fr; }
        }
    </style>
</head>
<body>
    <div style="display: none; font-size: 1px; color: #fefefe; line-height: 1px; font-family: Arial, sans-serif; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden;">
        ${preheader}
    </div>
    <div class="container">
        <div class="header">
            <a href="https://filright.com" class="logo">FilRight</a>
        </div>
        ${content}
        <div class="footer">
            <p class="footer-text">© 2025 FilRight. Jouw partner in affiliate marketing.</p>
            <div class="social-links">
                <a href="https://filright.com">Website</a>
                <a href="mailto:support@filright.com">Support</a>
                <a href="https://filright.com/dashboard">Dashboard</a>
            </div>
            <p class="footer-text" style="margin-top: 15px; font-size: 12px;">
                Je ontvangt deze email omdat je bent geregistreerd als FilRight affiliate.
            </p>
        </div>
    </div>
</body>
</html>
`;

// Welcome email template
const getWelcomeTemplate = (name, username, tempPassword) => {
    const content = `
        <div class="content">
            <h1 class="greeting">Welkom bij FilRight, ${name}! 🎉</h1>
            <p class="text">
                Geweldig dat je deel uitmaakt van ons affiliate netwerk! Je account is succesvol aangemaakt en je kunt nu beginnen met het verdienen van commissies.
            </p>
            
            <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 20px; margin: 25px 0;">
                <h3 style="color: #92400e; margin-bottom: 10px;">🔐 Je login gegevens:</h3>
                <p style="color: #92400e; margin: 5px 0;"><strong>Gebruikersnaam:</strong> ${username}</p>
                <p style="color: #92400e; margin: 5px 0;"><strong>Tijdelijk wachtwoord:</strong> <code style="background: #fbbf24; padding: 2px 6px; border-radius: 4px;">${tempPassword}</code></p>
                <p style="color: #92400e; font-size: 14px; margin-top: 15px;">
                    ⚠️ <strong>Belangrijk:</strong> Verander je wachtwoord direct na je eerste login voor de veiligheid.
                </p>
            </div>

            <div style="text-align: center; margin: 30px 0;">
                <a href="https://filright.com/dashboard/login" class="button">
                    🚀 Login in je Dashboard
                </a>
            </div>

            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-number">6%</div>
                    <div class="stat-label">Standaard Commissie</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">24/7</div>
                    <div class="stat-label">Tracking Actief</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">∞</div>
                    <div class="stat-label">Verdienpotentieel</div>
                </div>
            </div>

            <h3 style="color: #1f2937; margin: 30px 0 15px 0;">🎯 Wat kun je nu doen?</h3>
            <ul style="color: #4b5563; padding-left: 20px; margin-bottom: 25px;">
                <li style="margin: 8px 0;">Log in op je dashboard en verken je statistieken</li>
                <li style="margin: 8px 0;">Deel je unieke affiliate link op sociale media</li>
                <li style="margin: 8px 0;">Begin met het promoten van onze producten</li>
                <li style="margin: 8px 0;">Volg je verkopen en commissies in real-time</li>
            </ul>

            <p class="text">
                Heb je vragen? Ons support team staat klaar om je te helpen. Stuur een email naar 
                <a href="mailto:support@filright.com" style="color: #667eea; text-decoration: none;">support@filright.com</a>
            </p>

            <p class="text" style="margin-top: 30px; font-weight: 600;">
                Veel succes met je affiliate journey! 💪
            </p>
        </div>
    `;
    
    return getBaseTemplate(content, `Welkom bij FilRight! Je account is klaar - log nu in met je tijdelijke wachtwoord.`);
};

// Sale notification template
const getSaleNotificationTemplate = (name, orderDetails) => {
    const { orderId, amount, commission, product, date } = orderDetails;
    
    const content = `
        <div class="content">
            <h1 class="greeting">🎉 Nieuwe verkoop, ${name}!</h1>
            <p class="text">
                Gefeliciteerd! Je hebt zojuist een nieuwe verkoop gegenereerd. Hier zijn de details:
            </p>

            <div class="order-item">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                    <span class="order-id">Order #${orderId}</span>
                    <span class="order-amount">€${amount}</span>
                </div>
                <p style="color: #6b7280; font-size: 14px; margin: 5px 0;">
                    <strong>Product:</strong> ${product || 'FilRight Product'}
                </p>
                <p style="color: #6b7280; font-size: 14px; margin: 5px 0;">
                    <strong>Datum:</strong> ${new Date(date).toLocaleDateString('nl-NL', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    })}
                </p>
            </div>

            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-number">€${commission}</div>
                    <div class="stat-label">Jouw Commissie</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${((commission / amount) * 100).toFixed(1)}%</div>
                    <div class="stat-label">Commissie Percentage</div>
                </div>
            </div>

            <div style="background: #ecfdf5; border: 1px solid #10b981; border-radius: 8px; padding: 20px; margin: 25px 0; text-align: center;">
                <h3 style="color: #065f46; margin-bottom: 10px;">💰 Commissie Details</h3>
                <p style="color: #065f46; font-size: 18px; font-weight: 600;">
                    Je hebt <span class="highlight">€${commission}</span> verdiend met deze verkoop!
                </p>
                <p style="color: #047857; font-size: 14px; margin-top: 10px;">
                    Deze commissie wordt automatisch toegevoegd aan je account saldo.
                </p>
            </div>

            <div style="text-align: center; margin: 30px 0;">
                <a href="https://filright.com/dashboard" class="button">
                    📊 Bekijk je Dashboard
                </a>
            </div>

            <p class="text">
                Blijf promoten en verdien meer! Deel je affiliate link op verschillende kanalen voor maximale exposure.
            </p>
        </div>
    `;
    
    return getBaseTemplate(content, `Nieuwe verkoop! €${commission} commissie verdiend op order #${orderId}`);
};

// Weekly report template
const getWeeklyReportTemplate = (name, weeklyStats) => {
    const { totalSales, totalRevenue, totalCommission, topProducts, period } = weeklyStats;
    
    const content = `
        <div class="content">
            <h1 class="greeting">📈 Je weekrapport, ${name}</h1>
            <p class="text">
                Hier is een overzicht van je prestaties in de periode van <strong>${period}</strong>:
            </p>

            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-number">${totalSales}</div>
                    <div class="stat-label">Totaal Verkopen</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">€${totalRevenue}</div>
                    <div class="stat-label">Totale Omzet</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">€${totalCommission}</div>
                    <div class="stat-label">Jouw Commissie</div>
                </div>
            </div>

            ${totalSales > 0 ? `
                <h3 style="color: #1f2937; margin: 30px 0 15px 0;">🏆 Top Producten deze week:</h3>
                ${topProducts.map(product => `
                    <div class="order-item">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <span style="font-weight: 600;">${product.name}</span>
                            <span style="color: #059669; font-weight: 600;">${product.sales} verkopen</span>
                        </div>
                        <p style="color: #6b7280; font-size: 14px; margin-top: 5px;">
                            €${product.revenue} omzet • €${product.commission} commissie
                        </p>
                    </div>
                `).join('')}
            ` : `
                <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 20px; margin: 25px 0; text-align: center;">
                    <h3 style="color: #92400e; margin-bottom: 10px;">🎯 Geen verkopen deze week</h3>
                    <p style="color: #92400e;">
                        Geen zorgen! Blijf je affiliate link delen en de verkopen komen vanzelf.
                    </p>
                </div>
            `}

            <div style="background: #f0f9ff; border: 1px solid #0ea5e9; border-radius: 8px; padding: 20px; margin: 25px 0;">
                <h3 style="color: #0c4a6e; margin-bottom: 15px;">💡 Tips voor meer verkopen:</h3>
                <ul style="color: #0c4a6e; padding-left: 20px;">
                    <li style="margin: 8px 0;">Deel je link op verschillende sociale media platforms</li>
                    <li style="margin: 8px 0;">Creëer authentieke content over de producten</li>
                    <li style="margin: 8px 0;">Gebruik verschillende call-to-actions in je posts</li>
                    <li style="margin: 8px 0;">Analyseer welke content het beste werkt</li>
                </ul>
            </div>

            <div style="text-align: center; margin: 30px 0;">
                <a href="https://filright.com/dashboard" class="button">
                    📊 Bekijk Gedetailleerde Stats
                </a>
            </div>

            <p class="text">
                Bedankt voor je inzet deze week! Blijf zo doorgaan en laten we samen groeien. 🚀
            </p>
        </div>
    `;
    
    return getBaseTemplate(content, `Je weekrapport: ${totalSales} verkopen, €${totalCommission} commissie verdiend`);
};

// Password reset template
const getPasswordResetTemplate = (name, resetToken) => {
    const content = `
        <div class="content">
            <h1 class="greeting">🔐 Wachtwoord Reset, ${name}</h1>
            <p class="text">
                Je hebt een verzoek ingediend om je wachtwoord te resetten. Klik op de onderstaande knop om een nieuw wachtwoord in te stellen.
            </p>

            <div style="background: #fef2f2; border: 1px solid #f87171; border-radius: 8px; padding: 20px; margin: 25px 0;">
                <h3 style="color: #dc2626; margin-bottom: 10px;">⚠️ Belangrijk</h3>
                <ul style="color: #dc2626; padding-left: 20px;">
                    <li style="margin: 5px 0;">Deze link is 1 uur geldig</li>
                    <li style="margin: 5px 0;">Gebruik de link slechts één keer</li>
                    <li style="margin: 5px 0;">Heb je dit niet aangevraagd? Negeer deze email</li>
                </ul>
            </div>

            <div style="text-align: center; margin: 30px 0;">
                <a href="${EMAIL_CONFIG.domain}/reset-password?token=${resetToken}" class="button">
                    🔑 Nieuw Wachtwoord Instellen
                </a>
            </div>

            <p class="text">
                Als de knop niet werkt, kopieer dan deze link naar je browser:<br>
                <a href="${EMAIL_CONFIG.domain}/reset-password?token=${resetToken}" style="color: #667eea; word-break: break-all;">
                    ${EMAIL_CONFIG.domain}/reset-password?token=${resetToken}
                </a>
            </p>

            <p class="text">
                Heb je problemen? Neem contact op met ons support team via 
                <a href="mailto:support@filright.com" style="color: #667eea; text-decoration: none;">support@filright.com</a>
            </p>
        </div>
    `;
    
    return getBaseTemplate(content, `Reset je FilRight wachtwoord - link geldig voor 1 uur`);
};

// Email service functions
export const emailService = {
    async sendWelcomeEmail(to, name, username, tempPassword) {
        try {
            const resendClient = getResendClient();
            if (!resendClient) {
                throw new Error('RESEND_API_KEY not configured');
            }
            
            const { data, error } = await resendClient.emails.send({
                from: 'FilRight <noreply@filright.com>',
                to: [to],
                subject: '🎉 Welkom bij FilRight - Je account is klaar!',
                html: getWelcomeTemplate(name, username, tempPassword),
            });

            if (error) {
                console.error('❌ Welcome email error:', error);
                return { success: false, error };
            }

            console.log('✅ Welcome email sent:', data.id);
            return { success: true, messageId: data.id };
        } catch (error) {
            console.error('❌ Welcome email exception:', error);
            return { success: false, error: error.message };
        }
    },

    async sendSaleNotification(to, name, orderDetails) {
        try {
            const resendClient = getResendClient();
            if (!resendClient) {
                throw new Error('RESEND_API_KEY not configured');
            }
            
            const { data, error } = await resendClient.emails.send({
                from: 'FilRight <noreply@filright.com>',
                to: [to],
                subject: `🎉 Nieuwe verkoop! €${orderDetails.commission} commissie verdiend`,
                html: getSaleNotificationTemplate(name, orderDetails),
            });

            if (error) {
                console.error('❌ Sale notification error:', error);
                return { success: false, error };
            }

            console.log('✅ Sale notification sent:', data.id);
            return { success: true, messageId: data.id };
        } catch (error) {
            console.error('❌ Sale notification exception:', error);
            return { success: false, error: error.message };
        }
    },

    async sendWeeklyReport(to, name, weeklyStats) {
        try {
            const resendClient = getResendClient();
            if (!resendClient) {
                throw new Error('RESEND_API_KEY not configured');
            }
            
            const { data, error } = await resendClient.emails.send({
                from: 'FilRight <noreply@filright.com>',
                to: [to],
                subject: `📈 Je weekrapport: ${weeklyStats.totalSales} verkopen, €${weeklyStats.totalCommission} commissie`,
                html: getWeeklyReportTemplate(name, weeklyStats),
            });

            if (error) {
                console.error('❌ Weekly report error:', error);
                return { success: false, error };
            }

            console.log('✅ Weekly report sent:', data.id);
            return { success: true, messageId: data.id };
        } catch (error) {
            console.error('❌ Weekly report exception:', error);
            return { success: false, error: error.message };
        }
    },

    async sendPasswordReset(to, name, resetToken) {
        try {
            const resendClient = getResendClient();
            if (!resendClient) {
                throw new Error('RESEND_API_KEY not configured');
            }
            
            const { data, error } = await resendClient.emails.send({
                from: 'FilRight <support@filright.com>',
                to: [to],
                subject: '🔐 Reset je FilRight wachtwoord',
                html: getPasswordResetTemplate(name, resetToken),
            });

            if (error) {
                console.error('❌ Password reset error:', error);
                return { success: false, error };
            }

            console.log('✅ Password reset sent:', data.id);
            return { success: true, messageId: data.id };
        } catch (error) {
            console.error('❌ Password reset exception:', error);
            return { success: false, error: error.message };
        }
    }
};

export default emailService; 