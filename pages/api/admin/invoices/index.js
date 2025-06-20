import { sql } from '@vercel/postgres';
import { google } from 'googleapis';

// Get Google Sheets commission data for invoice generation
async function getCommissionData(influencerRef, periodStart, periodEnd) {
  try {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        type: 'service_account',
        private_key: process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        client_email: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
        client_id: '',
        auth_uri: 'https://accounts.google.com/o/oauth2/auth',
        token_uri: 'https://oauth2.googleapis.com/token',
        auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs'
      },
      scopes: [
        'https://www.googleapis.com/auth/spreadsheets',
        'https://www.googleapis.com/auth/drive.file'
      ]
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
    const range = 'Blad1!A:D';

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });

    const rows = response.data.values || [];
    const dataRows = rows.slice(1).filter(row => row.length >= 2);
    
    // Filter orders for this influencer within the period
    const orders = [];
    const startDate = new Date(periodStart);
    const endDate = new Date(periodEnd);
    
    dataRows.forEach(row => {
      const orderDate = new Date(row[0] || '');
      const influencer = row[1]?.toLowerCase();
      const orderRef = row[2] || '';
      const amount = row[3] ? parseFloat(row[3]) : 0;
      
      if (influencer === influencerRef.toLowerCase() && 
          orderDate >= startDate && 
          orderDate <= endDate && 
          amount > 0) {
        orders.push({
          date: row[0],
          orderRef: orderRef,
          amount: amount,
          description: `Commissie voor order ${orderRef}`
        });
      }
    });

    return orders;
  } catch (error) {
    console.error('❌ Google Sheets commission data error:', error);
    return [];
  }
}

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
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
    switch (req.method) {
      case 'GET':
        return await handleGetInvoices(req, res);
      case 'POST':
        return await handleCreateInvoice(req, res);
      case 'PUT':
        return await handleUpdateInvoice(req, res);
      case 'DELETE':
        return await handleDeleteInvoice(req, res);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('❌ Invoice API error:', error);
    return res.status(500).json({
      success: false,
      error: 'Server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

// GET /api/admin/invoices - List all invoices with filtering
async function handleGetInvoices(req, res) {
  const { 
    status, 
    influencer, 
    dateFrom, 
    dateTo, 
    limit = 50, 
    offset = 0 
  } = req.query;

  let whereConditions = [];
  let queryParams = [];
  let paramIndex = 1;

  // Build WHERE conditions
  if (status) {
    whereConditions.push(`i.status = $${paramIndex}`);
    queryParams.push(status);
    paramIndex++;
  }

  if (influencer) {
    whereConditions.push(`(LOWER(i.influencer_ref) LIKE $${paramIndex} OR LOWER(i.influencer_name) LIKE $${paramIndex})`);
    queryParams.push(`%${influencer.toLowerCase()}%`);
    paramIndex++;
  }

  if (dateFrom) {
    whereConditions.push(`i.invoice_date >= $${paramIndex}`);
    queryParams.push(dateFrom);
    paramIndex++;
  }

  if (dateTo) {
    whereConditions.push(`i.invoice_date <= $${paramIndex}`);
    queryParams.push(dateTo);
    paramIndex++;
  }

  const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

  const query = `
    SELECT 
      i.*,
      COUNT(ili.id) as line_items_count,
      COALESCE(SUM(ili.total_price), 0) as calculated_subtotal
    FROM invoices i
    LEFT JOIN invoice_line_items ili ON i.id = ili.invoice_id
    ${whereClause}
    GROUP BY i.id
    ORDER BY i.created_at DESC
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
  `;

  queryParams.push(parseInt(limit), parseInt(offset));

  const result = await sql.query(query, queryParams);
  const invoices = result.rows;

  // Get total count
  const countQuery = `
    SELECT COUNT(DISTINCT i.id) as total
    FROM invoices i
    ${whereClause}
  `;
  const countResult = await sql.query(countQuery, queryParams.slice(0, -2));
  const totalCount = parseInt(countResult.rows[0].total);

  res.status(200).json({
    success: true,
    data: invoices,
    pagination: {
      total: totalCount,
      limit: parseInt(limit),
      offset: parseInt(offset),
      hasMore: (parseInt(offset) + parseInt(limit)) < totalCount
    }
  });
}

// POST /api/admin/invoices - Create new invoice
async function handleCreateInvoice(req, res) {
  const {
    influencerRef,
    influencerName,
    influencerEmail,
    periodStart,
    periodEnd,
    customLineItems = [],
    autoGenerateFromCommissions = true,
    notes = ''
  } = req.body;

  if (!influencerRef || !influencerName || !influencerEmail || !periodStart || !periodEnd) {
    return res.status(400).json({
      success: false,
      error: 'Verplichte velden ontbreken'
    });
  }

  // Get invoice settings
  const settingsResult = await sql`SELECT * FROM invoice_settings ORDER BY id DESC LIMIT 1`;
  const settings = settingsResult.rows[0];
  
  if (!settings) {
    return res.status(500).json({
      success: false,
      error: 'Invoice instellingen niet gevonden. Voer eerst setup uit.'
    });
  }

  // Get influencer commission rate
  const influencerResult = await sql`
    SELECT commission FROM influencers WHERE ref = ${influencerRef} LIMIT 1
  `;
  const commissionRate = influencerResult.rows[0]?.commission || 6.0;

  // Generate invoice number
  const invoiceNumber = `${settings.invoice_prefix}${settings.next_invoice_number.toString().padStart(4, '0')}`;
  
  // Calculate dates
  const invoiceDate = new Date().toISOString().split('T')[0];
  const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // 30 days from now

  // Create invoice
  const invoiceResult = await sql`
    INSERT INTO invoices (
      invoice_number, influencer_ref, influencer_name, influencer_email,
      invoice_date, due_date, period_start, period_end,
      subtotal, btw_rate, btw_amount, total_amount, notes
    ) VALUES (
      ${invoiceNumber}, ${influencerRef}, ${influencerName}, ${influencerEmail},
      ${invoiceDate}, ${dueDate}, ${periodStart}, ${periodEnd},
      0.00, ${settings.default_btw_rate}, 0.00, 0.00, ${notes}
    ) RETURNING *
  `;

  const invoice = invoiceResult.rows[0];
  let lineItems = [];

  // Auto-generate line items from commission data
  if (autoGenerateFromCommissions) {
    const commissionData = await getCommissionData(influencerRef, periodStart, periodEnd);
    
    for (const order of commissionData) {
      const commissionAmount = (order.amount * commissionRate) / 100;
      
      await sql`
        INSERT INTO invoice_line_items (
          invoice_id, description, quantity, unit_price, total_price,
          commission_rate, order_reference, order_date
        ) VALUES (
          ${invoice.id}, ${order.description}, 1, ${commissionAmount}, ${commissionAmount},
          ${commissionRate}, ${order.orderRef}, ${order.date}
        )
      `;
      
      lineItems.push({
        description: order.description,
        quantity: 1,
        unit_price: commissionAmount,
        total_price: commissionAmount,
        commission_rate: commissionRate,
        order_reference: order.orderRef,
        order_date: order.date
      });
    }
  }

  // Add custom line items
  for (const item of customLineItems) {
    const totalPrice = item.quantity * item.unit_price;
    
    await sql`
      INSERT INTO invoice_line_items (
        invoice_id, description, quantity, unit_price, total_price
      ) VALUES (
        ${invoice.id}, ${item.description}, ${item.quantity}, ${item.unit_price}, ${totalPrice}
      )
    `;
    
    lineItems.push({
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total_price: totalPrice
    });
  }

  // Calculate totals
  const subtotal = lineItems.reduce((sum, item) => sum + item.total_price, 0);
  const btwAmount = (subtotal * settings.default_btw_rate) / 100;
  const totalAmount = subtotal + btwAmount;

  // Update invoice totals
  await sql`
    UPDATE invoices 
    SET subtotal = ${subtotal}, btw_amount = ${btwAmount}, total_amount = ${totalAmount}
    WHERE id = ${invoice.id}
  `;

  // Update next invoice number
  await sql`
    UPDATE invoice_settings 
    SET next_invoice_number = next_invoice_number + 1
    WHERE id = ${settings.id}
  `;

  console.log('✅ Invoice created:', invoiceNumber, 'for', influencerRef, '€' + totalAmount.toFixed(2));

  res.status(201).json({
    success: true,
    data: {
      ...invoice,
      subtotal,
      btw_amount: btwAmount,
      total_amount: totalAmount,
      line_items: lineItems
    },
    message: `Factuur ${invoiceNumber} aangemaakt voor ${influencerName}`
  });
}

// PUT /api/admin/invoices - Update invoice
async function handleUpdateInvoice(req, res) {
  const { id, status, payment_date, payment_reference, notes } = req.body;

  if (!id) {
    return res.status(400).json({
      success: false,
      error: 'Invoice ID is verplicht'
    });
  }

  const updates = [];
  const params = [];
  let paramIndex = 1;

  if (status) {
    updates.push(`status = $${paramIndex}`);
    params.push(status);
    paramIndex++;
  }

  if (payment_date) {
    updates.push(`payment_date = $${paramIndex}`);
    params.push(payment_date);
    paramIndex++;
  }

  if (payment_reference) {
    updates.push(`payment_reference = $${paramIndex}`);
    params.push(payment_reference);
    paramIndex++;
  }

  if (notes !== undefined) {
    updates.push(`notes = $${paramIndex}`);
    params.push(notes);
    paramIndex++;
  }

  updates.push(`updated_at = CURRENT_TIMESTAMP`);

  const query = `
    UPDATE invoices 
    SET ${updates.join(', ')}
    WHERE id = $${paramIndex}
    RETURNING *
  `;
  params.push(id);

  const result = await sql.query(query, params);
  
  if (result.rows.length === 0) {
    return res.status(404).json({
      success: false,
      error: 'Factuur niet gevonden'
    });
  }

  res.status(200).json({
    success: true,
    data: result.rows[0],
    message: 'Factuur bijgewerkt'
  });
}

// DELETE /api/admin/invoices - Delete invoice
async function handleDeleteInvoice(req, res) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({
      success: false,
      error: 'Invoice ID is verplicht'
    });
  }

  // Check if invoice exists and is deletable
  const invoiceResult = await sql`
    SELECT * FROM invoices WHERE id = ${id}
  `;

  if (invoiceResult.rows.length === 0) {
    return res.status(404).json({
      success: false,
      error: 'Factuur niet gevonden'
    });
  }

  const invoice = invoiceResult.rows[0];

  if (invoice.status === 'paid') {
    return res.status(400).json({
      success: false,
      error: 'Betaalde facturen kunnen niet worden verwijderd'
    });
  }

  // Delete invoice (line items will be deleted automatically due to CASCADE)
  await sql`DELETE FROM invoices WHERE id = ${id}`;

  res.status(200).json({
    success: true,
    message: `Factuur ${invoice.invoice_number} verwijderd`
  });
} 