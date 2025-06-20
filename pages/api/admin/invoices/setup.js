import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
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
    console.log('🏗️ Setting up invoice database schema...');

    // Create invoices table
    await sql`
      CREATE TABLE IF NOT EXISTS invoices (
        id SERIAL PRIMARY KEY,
        invoice_number VARCHAR(50) UNIQUE NOT NULL,
        influencer_ref VARCHAR(50) NOT NULL,
        influencer_name VARCHAR(255) NOT NULL,
        influencer_email VARCHAR(255) NOT NULL,
        invoice_date DATE NOT NULL,
        due_date DATE NOT NULL,
        period_start DATE NOT NULL,
        period_end DATE NOT NULL,
        subtotal DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        btw_rate DECIMAL(5,2) NOT NULL DEFAULT 21.00,
        btw_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        total_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        status VARCHAR(50) NOT NULL DEFAULT 'draft',
        payment_date DATE NULL,
        payment_reference VARCHAR(255) NULL,
        notes TEXT NULL,
        pdf_path VARCHAR(500) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create invoice_line_items table
    await sql`
      CREATE TABLE IF NOT EXISTS invoice_line_items (
        id SERIAL PRIMARY KEY,
        invoice_id INTEGER NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
        description TEXT NOT NULL,
        quantity DECIMAL(10,2) NOT NULL DEFAULT 1.00,
        unit_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        total_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        commission_rate DECIMAL(5,2) NOT NULL DEFAULT 0.00,
        order_reference VARCHAR(255) NULL,
        order_date DATE NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create payment_reminders table
    await sql`
      CREATE TABLE IF NOT EXISTS payment_reminders (
        id SERIAL PRIMARY KEY,
        invoice_id INTEGER NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
        reminder_type VARCHAR(50) NOT NULL,
        sent_date TIMESTAMP NOT NULL,
        email_sent BOOLEAN DEFAULT FALSE,
        reminder_count INTEGER DEFAULT 1,
        next_reminder_date DATE NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create invoice_settings table for company info
    await sql`
      CREATE TABLE IF NOT EXISTS invoice_settings (
        id SERIAL PRIMARY KEY,
        company_name VARCHAR(255) NOT NULL DEFAULT 'Filright B.V.',
        company_address TEXT NOT NULL DEFAULT 'Businessadres\n1234 AB Amsterdam\nNederland',
        company_email VARCHAR(255) NOT NULL DEFAULT 'facturen@filright.com',
        company_phone VARCHAR(50) NOT NULL DEFAULT '+31 (0)20 123 4567',
        company_website VARCHAR(255) NOT NULL DEFAULT 'www.filright.com',
        kvk_number VARCHAR(50) NOT NULL DEFAULT '12345678',
        btw_number VARCHAR(50) NOT NULL DEFAULT 'NL123456789B01',
        iban VARCHAR(50) NOT NULL DEFAULT 'NL91 ABNA 0417 1643 00',
        logo_url VARCHAR(500) NULL,
        invoice_terms TEXT NOT NULL DEFAULT 'Betaling binnen 30 dagen na factuurdatum.',
        default_btw_rate DECIMAL(5,2) NOT NULL DEFAULT 21.00,
        invoice_prefix VARCHAR(10) NOT NULL DEFAULT 'FR',
        next_invoice_number INTEGER NOT NULL DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Insert default settings if not exists
    const settingsCheck = await sql`SELECT COUNT(*) FROM invoice_settings`;
    if (parseInt(settingsCheck.rows[0].count) === 0) {
      await sql`
        INSERT INTO invoice_settings (
          company_name, company_address, company_email, company_phone,
          company_website, kvk_number, btw_number, iban, invoice_terms
        ) VALUES (
          'Filright B.V.',
          'Hoofdstraat 123
1234 AB Amsterdam
Nederland',
          'facturen@filright.com',
          '+31 (0)20 123 4567',
          'www.filright.com',
          '87654321',
          'NL123456789B01',
          'NL91 ABNA 0417 1643 00',
          'Betaling dient te geschieden binnen 30 dagen na factuurdatum.
Bij niet tijdige betaling worden wettelijke rente en incassokosten in rekening gebracht.'
        )
      `;
    }

    // Create indexes for better performance
    await sql`CREATE INDEX IF NOT EXISTS idx_invoices_influencer_ref ON invoices(influencer_ref)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_invoices_date ON invoices(invoice_date)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_payment_reminders_invoice_id ON payment_reminders(invoice_id)`;

    console.log('✅ Invoice database schema created successfully');

    res.status(200).json({
      success: true,
      message: 'Invoice database schema opgezet',
      tables: [
        'invoices',
        'invoice_line_items', 
        'payment_reminders',
        'invoice_settings'
      ]
    });

  } catch (error) {
    console.error('❌ Invoice setup error:', error);
    
    res.status(500).json({
      success: false,
      error: 'Database setup error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
} 