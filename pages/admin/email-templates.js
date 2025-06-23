import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

export default function EmailTemplates() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminUser, setAdminUser] = useState(null);
  const [templates, setTemplates] = useState({
    welcome: {
      name: 'Welkomst Email',
      description: 'Email die wordt verstuurd bij nieuwe registraties',
      subject: 'Welkom bij FilAF - Je account is aangemaakt!',
      html: `<!DOCTYPE html>
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
        @media (max-width: 600px) {
            .container { margin: 0; border-radius: 0; }
            .header, .content, .footer { padding: 20px; }
            .stats-grid { grid-template-columns: 1fr; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <a href="https://affiliate.filright.com" class="logo">FilRight</a>
        </div>
        <div class="content">
            <h1 class="greeting">Welkom bij FilRight, {{name}}! 🎉</h1>
            <p class="text">
                Geweldig dat je deel uitmaakt van ons affiliate netwerk! Je account is succesvol aangemaakt en je kunt nu beginnen met het verdienen van commissies.
            </p>
            
            <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 20px; margin: 25px 0;">
                <h3 style="color: #92400e; margin-bottom: 10px;">🔐 Je login gegevens:</h3>
                <p style="color: #92400e; margin: 5px 0;"><strong>Gebruikersnaam:</strong> {{username}}</p>
                <p style="color: #92400e; margin: 5px 0;"><strong>Tijdelijk wachtwoord:</strong> <code style="background: #fbbf24; padding: 2px 6px; border-radius: 4px;">{{password}}</code></p>
                <p style="color: #92400e; font-size: 14px; margin-top: 15px;">
                    ⚠️ <strong>Belangrijk:</strong> Verander je wachtwoord direct na je eerste login voor de veiligheid.
                </p>
            </div>

            <div style="text-align: center; margin: 30px 0;">
                <a href="{{loginUrl}}" class="button">
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
                    <div class="stat-label">Support Beschikbaar</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">€0</div>
                    <div class="stat-label">Startkosten</div>
                </div>
            </div>

            <p class="text">
                <strong>Volgende stappen:</strong>
            </p>
            <ul style="color: #4b5563; margin: 20px 0; padding-left: 20px;">
                <li>Log in op je dashboard</li>
                <li>Vul je profiel aan met je social media accounts</li>
                <li>Download je unieke affiliate links</li>
                <li>Begin met promoten en verdien commissies!</li>
            </ul>

            <p class="text">
                Heb je vragen? Neem gerust contact op via <a href="mailto:support@filright.com" style="color: #667eea;">support@filright.com</a>
            </p>
        </div>
        <div class="footer">
            <p class="footer-text">© 2025 FilRight. Jouw partner in affiliate marketing.</p>
            <div class="social-links">
                <a href="https://affiliate.filright.com">Website</a>
                <a href="mailto:support@filright.com">Support</a>
                <a href="https://affiliate.filright.com/dashboard">Dashboard</a>
            </div>
            <p class="footer-text" style="margin-top: 15px; font-size: 12px;">
                Je ontvangt deze email omdat je bent geregistreerd als FilRight affiliate.
            </p>
        </div>
    </div>
</body>
</html>`,
      text: `Welkom bij FilRight, {{name}}! 🎉

Geweldig dat je deel uitmaakt van ons affiliate netwerk! Je account is succesvol aangemaakt en je kunt nu beginnen met het verdienen van commissies.

🔐 Je login gegevens:
Gebruikersnaam: {{username}}
Tijdelijk wachtwoord: {{password}}

⚠️ Belangrijk: Verander je wachtwoord direct na je eerste login voor de veiligheid.

🚀 Login in je Dashboard: {{loginUrl}}

Volgende stappen:
• Log in op je dashboard
• Vul je profiel aan met je social media accounts
• Download je unieke affiliate links
• Begin met promoten en verdien commissies!

Heb je vragen? Neem gerust contact op via support@filright.com

© 2025 FilRight. Jouw partner in affiliate marketing.`,
      variables: ['name', 'username', 'password', 'loginUrl']
    },
    sale: {
      name: 'Verkoop Notificatie',
      description: 'Email bij nieuwe verkoop/commissie',
      subject: '🎉 Nieuwe verkoop! Je hebt commissie verdiend',
      html: `<!DOCTYPE html>
<html lang="nl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>FilRight - Nieuwe Verkoop!</title>
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
            background: linear-gradient(135deg, #059669 0%, #10b981 100%);
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
            background: linear-gradient(135deg, #059669 0%, #10b981 100%);
            color: white;
            text-decoration: none;
            padding: 16px 32px;
            border-radius: 8px;
            font-weight: 600;
            margin: 20px 0;
            transition: transform 0.2s;
        }
        .button:hover { transform: translateY(-1px); }
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
            border-left: 4px solid #059669;
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
            color: #059669; 
            text-decoration: none; 
            margin: 0 10px;
        }
        @media (max-width: 600px) {
            .container { margin: 0; border-radius: 0; }
            .header, .content, .footer { padding: 20px; }
            .stats-grid { grid-template-columns: 1fr; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <a href="https://affiliate.filright.com" class="logo">FilRight</a>
        </div>
        <div class="content">
            <h1 class="greeting">🎉 Gefeliciteerd {{name}}!</h1>
            <p class="text">
                Je hebt een nieuwe verkoop gegenereerd! Hier zijn de details van je succesvolle affiliate actie.
            </p>
            
            <div class="order-item">
                <div class="order-id">Bestelling #{{orderId}}</div>
                <div class="order-amount">€{{amount}}</div>
                <div style="clear: both; margin-top: 10px;">
                    <strong>Jouw commissie:</strong> €{{commission}}
                </div>
            </div>

            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-number">€{{totalEarnings}}</div>
                    <div class="stat-label">Totale Verdiensten</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">€{{commission}}</div>
                    <div class="stat-label">Deze Verkoop</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">+1</div>
                    <div class="stat-label">Nieuwe Klant</div>
                </div>
            </div>

            <div style="text-align: center; margin: 30px 0;">
                <a href="https://affiliate.filright.com/dashboard" class="button">
                    📊 Bekijk je Dashboard
                </a>
            </div>

            <p class="text">
                <strong>Tips voor meer verkopen:</strong>
            </p>
            <ul style="color: #4b5563; margin: 20px 0; padding-left: 20px;">
                <li>Deel je affiliate links op social media</li>
                <li>Schrijf reviews over de producten</li>
                <li>Maak video content over je ervaringen</li>
                <li>Netwerk met andere affiliates</li>
            </ul>

            <p class="text">
                Blijf geweldig werk doen! 💪
            </p>
        </div>
        <div class="footer">
            <p class="footer-text">© 2025 FilRight. Jouw partner in affiliate marketing.</p>
            <div class="social-links">
                <a href="https://affiliate.filright.com">Website</a>
                <a href="mailto:support@filright.com">Support</a>
                <a href="https://affiliate.filright.com/dashboard">Dashboard</a>
            </div>
            <p class="footer-text" style="margin-top: 15px; font-size: 12px;">
                Je ontvangt deze email omdat je bent geregistreerd als FilRight affiliate.
            </p>
        </div>
    </div>
</body>
</html>`,
      text: `🎉 Gefeliciteerd {{name}}!

Je hebt een nieuwe verkoop gegenereerd! Hier zijn de details van je succesvolle affiliate actie.

Bestelling #{{orderId}}
Bedrag: €{{amount}}
Jouw commissie: €{{commission}}

📊 Bekijk je Dashboard: https://affiliate.filright.com/dashboard

Tips voor meer verkopen:
• Deel je affiliate links op social media
• Schrijf reviews over de producten
• Maak video content over je ervaringen
• Netwerk met andere affiliates

Blijf geweldig werk doen! 💪

© 2025 FilRight. Jouw partner in affiliate marketing.`,
      variables: ['name', 'orderId', 'amount', 'commission', 'totalEarnings']
    },
    weekly: {
      name: 'Wekelijks Rapport',
      description: 'Wekelijkse prestatie samenvatting',
      subject: '📊 Je wekelijkse FilAF rapport',
      html: `<!DOCTYPE html>
<html lang="nl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>FilRight - Wekelijks Rapport</title>
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
            background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
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
            background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
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
            border-left: 4px solid #3b82f6;
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
            color: #3b82f6; 
            text-decoration: none; 
            margin: 0 10px;
        }
        @media (max-width: 600px) {
            .container { margin: 0; border-radius: 0; }
            .header, .content, .footer { padding: 20px; }
            .stats-grid { grid-template-columns: 1fr; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <a href="https://affiliate.filright.com" class="logo">FilRight</a>
        </div>
        <div class="content">
            <h1 class="greeting">📊 Wekelijks Rapport - Week {{weekNumber}}</h1>
            <p class="text">
                Hier is je wekelijkse overzicht van je affiliate prestaties, {{name}}!
            </p>
            
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-number">€{{totalSales}}</div>
                    <div class="stat-label">Totale Verkopen</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">€{{totalCommission}}</div>
                    <div class="stat-label">Jouw Commissie</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">+5</div>
                    <div class="stat-label">Nieuwe Klanten</div>
                </div>
            </div>

            <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 20px; margin: 25px 0;">
                <h3 style="color: #92400e; margin-bottom: 10px;">🏆 Top Producten deze week:</h3>
                <ul style="color: #92400e; margin: 10px 0; padding-left: 20px;">
                    {{#each topProducts}}
                    <li>{{this}}</li>
                    {{/each}}
                </ul>
            </div>

            <div style="text-align: center; margin: 30px 0;">
                <a href="https://affiliate.filright.com/dashboard" class="button">
                    📈 Bekijk Volledig Rapport
                </a>
            </div>

            <p class="text">
                <strong>Volgende week doelen:</strong>
            </p>
            <ul style="color: #4b5563; margin: 20px 0; padding-left: 20px;">
                <li>Verhoog je social media engagement</li>
                <li>Probeer nieuwe content formats</li>
                <li>Netwerk met andere affiliates</li>
                <li>Analyseer je best presterende links</li>
            </ul>

            <p class="text">
                Blijf geweldig werk doen! 🚀
            </p>
        </div>
        <div class="footer">
            <p class="footer-text">© 2025 FilRight. Jouw partner in affiliate marketing.</p>
            <div class="social-links">
                <a href="https://affiliate.filright.com">Website</a>
                <a href="mailto:support@filright.com">Support</a>
                <a href="https://affiliate.filright.com/dashboard">Dashboard</a>
            </div>
            <p class="footer-text" style="margin-top: 15px; font-size: 12px;">
                Je ontvangt deze email omdat je bent geregistreerd als FilRight affiliate.
            </p>
        </div>
    </div>
</body>
</html>`,
      text: `📊 Wekelijks Rapport - Week {{weekNumber}}

Hier is je wekelijkse overzicht van je affiliate prestaties, {{name}}!

Totale Verkopen: €{{totalSales}}
Jouw Commissie: €{{totalCommission}}
Nieuwe Klanten: +5

🏆 Top Producten deze week:
{{#each topProducts}}
• {{this}}
{{/each}}

📈 Bekijk Volledig Rapport: https://affiliate.filright.com/dashboard

Volgende week doelen:
• Verhoog je social media engagement
• Probeer nieuwe content formats
• Netwerk met andere affiliates
• Analyseer je best presterende links

Blijf geweldig werk doen! 🚀

© 2025 FilRight. Jouw partner in affiliate marketing.`,
      variables: ['name', 'weekNumber', 'totalSales', 'totalCommission', 'topProducts']
    },
    passwordReset: {
      name: 'Wachtwoord Reset',
      description: 'Email voor wachtwoord herstel',
      subject: '🔐 Wachtwoord reset voor je FilAF account',
      html: `<!DOCTYPE html>
<html lang="nl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>FilRight - Wachtwoord Reset</title>
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
            background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%);
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
            background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%);
            color: white;
            text-decoration: none;
            padding: 16px 32px;
            border-radius: 8px;
            font-weight: 600;
            margin: 20px 0;
            transition: transform 0.2s;
        }
        .button:hover { transform: translateY(-1px); }
        .warning-box {
            background: #fef2f2;
            border: 1px solid #fecaca;
            border-radius: 8px;
            padding: 20px;
            margin: 25px 0;
        }
        .warning-title {
            color: #dc2626;
            font-weight: 600;
            margin-bottom: 10px;
        }
        .warning-text {
            color: #7f1d1d;
            font-size: 14px;
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
            color: #dc2626; 
            text-decoration: none; 
            margin: 0 10px;
        }
        @media (max-width: 600px) {
            .container { margin: 0; border-radius: 0; }
            .header, .content, .footer { padding: 20px; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <a href="https://affiliate.filright.com" class="logo">FilRight</a>
        </div>
        <div class="content">
            <h1 class="greeting">🔐 Wachtwoord Reset</h1>
            <p class="text">
                Hallo {{name}}, je hebt een wachtwoord reset aangevraagd voor je FilRight account.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="{{resetUrl}}" class="button">
                    🔐 Nieuw Wachtwoord Instellen
                </a>
            </div>

            <div class="warning-box">
                <div class="warning-title">⚠️ Belangrijke informatie:</div>
                <div class="warning-text">
                    • Deze link is {{expiryTime}} geldig<br>
                    • De link werkt slechts één keer<br>
                    • Als je geen reset hebt aangevraagd, kun je deze email negeren<br>
                    • Voor vragen, neem contact op via support@filright.com
                </div>
            </div>

            <p class="text">
                <strong>Veiligheids tips:</strong>
            </p>
            <ul style="color: #4b5563; margin: 20px 0; padding-left: 20px;">
                <li>Kies een sterk wachtwoord met minimaal 8 karakters</li>
                <li>Gebruik een combinatie van letters, cijfers en symbolen</li>
                <li>Deel je wachtwoord nooit met anderen</li>
                <li>Schakel twee-factor authenticatie in</li>
            </ul>

            <p class="text">
                Als je problemen ondervindt, neem dan contact op via <a href="mailto:support@filright.com" style="color: #dc2626;">support@filright.com</a>
            </p>
        </div>
        <div class="footer">
            <p class="footer-text">© 2025 FilRight. Jouw partner in affiliate marketing.</p>
            <div class="social-links">
                <a href="https://affiliate.filright.com">Website</a>
                <a href="mailto:support@filright.com">Support</a>
                <a href="https://affiliate.filright.com/dashboard">Dashboard</a>
            </div>
            <p class="footer-text" style="margin-top: 15px; font-size: 12px;">
                Je ontvangt deze email omdat je bent geregistreerd als FilRight affiliate.
            </p>
        </div>
    </div>
</body>
</html>`,
      text: `🔐 Wachtwoord Reset

Hallo {{name}}, je hebt een wachtwoord reset aangevraagd voor je FilRight account.

🔐 Nieuw Wachtwoord Instellen: {{resetUrl}}

⚠️ Belangrijke informatie:
• Deze link is {{expiryTime}} geldig
• De link werkt slechts één keer
• Als je geen reset hebt aangevraagd, kun je deze email negeren
• Voor vragen, neem contact op via support@filright.com

Veiligheids tips:
• Kies een sterk wachtwoord met minimaal 8 karakters
• Gebruik een combinatie van letters, cijfers en symbolen
• Deel je wachtwoord nooit met anderen
• Schakel twee-factor authenticatie in

Als je problemen ondervindt, neem dan contact op via support@filright.com

© 2025 FilRight. Jouw partner in affiliate marketing.`,
      variables: ['name', 'resetUrl', 'expiryTime']
    }
  });
  const [activeTemplate, setActiveTemplate] = useState('welcome');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [previewMode, setPreviewMode] = useState('html'); // 'html' or 'text'
  const router = useRouter();

  useEffect(() => {
    const adminToken = localStorage.getItem('adminToken');
    const storedAdminUser = localStorage.getItem('adminUser');
    
    if (adminToken && storedAdminUser) {
      setAdminUser(JSON.parse(storedAdminUser));
      setIsAuthenticated(true);
      loadTemplates();
    } else {
      router.push('/admin/login');
    }
  }, []);

  const loadTemplates = async () => {
    try {
      // In een echte implementatie zou je hier de templates van de database laden
      // Voor nu gebruiken we de standaard templates
      console.log('📧 Loading email templates...');
    } catch (error) {
      console.error('❌ Error loading templates:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    router.push('/admin/login');
  };

  const handleTemplateChange = (field, value) => {
    setTemplates(prev => ({
      ...prev,
      [activeTemplate]: {
        ...prev[activeTemplate],
        [field]: value
      }
    }));
  };

  const handleSaveTemplate = async () => {
    try {
      setIsSaving(true);
      
      // Hier zou je de template naar de database opslaan
      console.log('💾 Saving template:', activeTemplate, templates[activeTemplate]);
      
      // Simuleer API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setIsEditing(false);
      setTestResult({
        type: 'success',
        message: 'Template succesvol opgeslagen!'
      });
      
      setTimeout(() => setTestResult(null), 3000);
    } catch (error) {
      console.error('❌ Error saving template:', error);
      setTestResult({
        type: 'error',
        message: 'Fout bij opslaan template: ' + error.message
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestTemplate = async () => {
    try {
      setIsTesting(true);
      
      const response = await fetch('/api/admin/test-email-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify({
          template: activeTemplate,
          testData: getTestData(activeTemplate)
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        setTestResult({
          type: 'success',
          message: `Test email verstuurd naar ${adminUser.email}!`
        });
      } else {
        setTestResult({
          type: 'error',
          message: result.error || 'Fout bij versturen test email'
        });
      }
    } catch (error) {
      console.error('❌ Error testing template:', error);
      setTestResult({
        type: 'error',
        message: 'Fout bij versturen test email: ' + error.message
      });
    } finally {
      setIsTesting(false);
    }
  };

  const getTestData = (template) => {
    const testData = {
      welcome: {
        name: 'Test Gebruiker',
        username: 'testuser123',
        password: 'testpass123',
        loginUrl: 'https://affiliate.filright.com/dashboard/login'
      },
      sale: {
        name: 'Test Gebruiker',
        orderId: 'ORD-2024-001',
        amount: 149.99,
        commission: 14.99,
        totalEarnings: 234.56
      },
      weekly: {
        name: 'Test Gebruiker',
        weekNumber: 25,
        totalSales: 1247.89,
        totalCommission: 124.79,
        topProducts: ['Product A', 'Product B', 'Product C']
      },
      passwordReset: {
        name: 'Test Gebruiker',
        resetUrl: 'https://affiliate.filright.com/reset-password?token=test123',
        expiryTime: '1 uur'
      }
    };
    
    return testData[template] || {};
  };

  const getPreviewContent = () => {
    const template = templates[activeTemplate];
    const testData = getTestData(activeTemplate);
    
    // Simpele template rendering (in productie zou je een echte template engine gebruiken)
    let content = template[previewMode];
    
    // Vervang variabelen met test data
    Object.entries(testData).forEach(([key, value]) => {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      content = content.replace(regex, value);
    });
    
    return content;
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/admin/dashboard')}
                className="flex items-center text-gray-300 hover:text-white transition-colors"
              >
                <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Terug naar Dashboard
              </button>
              <h1 className="text-xl font-semibold">📧 Email Template Editor</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-400">
                Ingelogd als: {adminUser?.email}
              </span>
              <button
                onClick={handleLogout}
                className="text-gray-300 hover:text-white transition-colors"
              >
                Uitloggen
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Result Message */}
        {testResult && (
          <div className={`mb-6 p-4 rounded-lg border ${
            testResult.type === 'success' 
              ? 'bg-green-900/20 border-green-800 text-green-300' 
              : 'bg-red-900/20 border-red-800 text-red-300'
          }`}>
            <div className="flex items-center">
              {testResult.type === 'success' ? (
                <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
              <span>{testResult.message}</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Template Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 p-6">
              <h2 className="text-lg font-semibold mb-4">Templates</h2>
              
              <div className="space-y-2">
                {Object.entries(templates).map(([key, template]) => (
                  <button
                    key={key}
                    onClick={() => setActiveTemplate(key)}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      activeTemplate === key
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                    }`}
                  >
                    <div className="font-medium">{template.name}</div>
                    <div className="text-sm opacity-75">{template.description}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Template Editor */}
          <div className="lg:col-span-3">
            <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-700">
              {/* Template Header */}
              <div className="p-6 border-b border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold">{templates[activeTemplate].name}</h2>
                    <p className="text-gray-400">{templates[activeTemplate].description}</p>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => setIsEditing(!isEditing)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isEditing
                          ? 'bg-gray-600 text-white'
                          : 'bg-blue-600 hover:bg-blue-700 text-white'
                      }`}
                    >
                      {isEditing ? 'Annuleren' : 'Bewerken'}
                    </button>
                    
                    {isEditing && (
                      <button
                        onClick={handleSaveTemplate}
                        disabled={isSaving}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-lg text-sm font-medium transition-colors"
                      >
                        {isSaving ? 'Opslaan...' : 'Opslaan'}
                      </button>
                    )}
                    
                    <button
                      onClick={handleTestTemplate}
                      disabled={isTesting}
                      className="px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-600 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      {isTesting ? 'Testen...' : 'Test Email'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Template Content */}
              <div className="p-6">
                {isEditing ? (
                  <div className="space-y-6">
                    {/* Subject */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Email Onderwerp
                      </label>
                      <input
                        type="text"
                        value={templates[activeTemplate].subject}
                        onChange={(e) => handleTemplateChange('subject', e.target.value)}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    {/* Preview Mode Toggle */}
                    <div className="flex items-center space-x-4">
                      <span className="text-sm font-medium text-gray-300">Preview Mode:</span>
                      <div className="flex bg-gray-700 rounded-lg p-1">
                        <button
                          onClick={() => setPreviewMode('html')}
                          className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                            previewMode === 'html'
                              ? 'bg-blue-600 text-white'
                              : 'text-gray-300 hover:text-white'
                          }`}
                        >
                          HTML
                        </button>
                        <button
                          onClick={() => setPreviewMode('text')}
                          className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                            previewMode === 'text'
                              ? 'bg-blue-600 text-white'
                              : 'text-gray-300 hover:text-white'
                          }`}
                        >
                          Text
                        </button>
                      </div>
                    </div>

                    {/* Template Variables */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Beschikbare Variabelen
                      </label>
                      <div className="bg-gray-700 rounded-lg p-3">
                        <div className="grid grid-cols-2 gap-2">
                          {templates[activeTemplate].variables.map(variable => (
                            <code key={variable} className="text-sm bg-gray-600 px-2 py-1 rounded text-blue-300">
                              {`{{${variable}}}`}
                            </code>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Template Editor */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        {previewMode.toUpperCase()} Template
                      </label>
                      <textarea
                        value={templates[activeTemplate][previewMode]}
                        onChange={(e) => handleTemplateChange(previewMode, e.target.value)}
                        rows={20}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                        placeholder={`Voer je ${previewMode.toUpperCase()} template in...`}
                      />
                    </div>
                  </div>
                ) : (
                  /* Preview Mode */
                  <div className="space-y-6">
                    {/* Subject Preview */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Email Onderwerp
                      </label>
                      <div className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white">
                        {templates[activeTemplate].subject}
                      </div>
                    </div>

                    {/* Preview Mode Toggle */}
                    <div className="flex items-center space-x-4">
                      <span className="text-sm font-medium text-gray-300">Preview Mode:</span>
                      <div className="flex bg-gray-700 rounded-lg p-1">
                        <button
                          onClick={() => setPreviewMode('html')}
                          className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                            previewMode === 'html'
                              ? 'bg-blue-600 text-white'
                              : 'text-gray-300 hover:text-white'
                          }`}
                        >
                          HTML
                        </button>
                        <button
                          onClick={() => setPreviewMode('text')}
                          className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                            previewMode === 'text'
                              ? 'bg-blue-600 text-white'
                              : 'text-gray-300 hover:text-white'
                          }`}
                        >
                          Text
                        </button>
                      </div>
                    </div>

                    {/* Template Preview */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        {previewMode.toUpperCase()} Preview (met test data)
                      </label>
                      <div className="bg-gray-700 border border-gray-600 rounded-lg p-4">
                        {previewMode === 'html' ? (
                          <div 
                            className="prose prose-invert max-w-none"
                            dangerouslySetInnerHTML={{ __html: getPreviewContent() }}
                          />
                        ) : (
                          <pre className="text-white whitespace-pre-wrap font-mono text-sm">
                            {getPreviewContent()}
                          </pre>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 