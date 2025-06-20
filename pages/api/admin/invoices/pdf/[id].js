import { sql } from '@vercel/postgres';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

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

  const { id } = req.query;

  if (!id) {
    return res.status(400).json({
      success: false,
      error: 'Invoice ID is verplicht'
    });
  }

  try {
    // Get invoice with line items
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

    // Get line items
    const lineItemsResult = await sql`
      SELECT * FROM invoice_line_items WHERE invoice_id = ${id} ORDER BY created_at
    `;
    const lineItems = lineItemsResult.rows;

    // Get company settings
    const settingsResult = await sql`
      SELECT * FROM invoice_settings ORDER BY id DESC LIMIT 1
    `;
    const settings = settingsResult.rows[0];

    if (!settings) {
      return res.status(500).json({
        success: false,
        error: 'Invoice instellingen niet gevonden'
      });
    }

    // Generate PDF
    const doc = new jsPDF();
    
    // Set up colors
    const primaryColor = [41, 128, 185]; // Blue
    const darkColor = [52, 73, 94]; // Dark gray
    const lightColor = [236, 240, 241]; // Light gray

    // Company logo and header
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, 210, 40, 'F'); // Header background
    
    // Company name
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text(settings.company_name, 20, 25);
    
    // Invoice title
    doc.setFontSize(16);
    doc.setFont('helvetica', 'normal');
    doc.text('FACTUUR', 150, 25);

    // Reset text color
    doc.setTextColor(...darkColor);

    // Company details
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const companyAddress = settings.company_address.split('\n');
    let yPos = 50;
    
    companyAddress.forEach(line => {
      doc.text(line, 20, yPos);
      yPos += 5;
    });

    doc.text(`Email: ${settings.company_email}`, 20, yPos + 5);
    doc.text(`Telefoon: ${settings.company_phone}`, 20, yPos + 10);
    doc.text(`Website: ${settings.company_website}`, 20, yPos + 15);

    // Company registration details
    doc.text(`KvK: ${settings.kvk_number}`, 20, yPos + 25);
    doc.text(`BTW: ${settings.btw_number}`, 20, yPos + 30);
    doc.text(`IBAN: ${settings.iban}`, 20, yPos + 35);

    // Invoice details box
    doc.setFillColor(...lightColor);
    doc.rect(120, 50, 70, 45, 'F');
    doc.setDrawColor(...darkColor);
    doc.rect(120, 50, 70, 45, 'S');

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Factuurnummer:', 125, 60);
    doc.text('Factuurdatum:', 125, 68);
    doc.text('Vervaldatum:', 125, 76);
    doc.text('Periode:', 125, 84);

    doc.setFont('helvetica', 'normal');
    doc.text(invoice.invoice_number, 165, 60);
    doc.text(new Date(invoice.invoice_date).toLocaleDateString('nl-NL'), 165, 68);
    doc.text(new Date(invoice.due_date).toLocaleDateString('nl-NL'), 165, 76);
    doc.text(`${new Date(invoice.period_start).toLocaleDateString('nl-NL')} - ${new Date(invoice.period_end).toLocaleDateString('nl-NL')}`, 125, 92);

    // Bill to section
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Factuur aan:', 20, 110);

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(invoice.influencer_name, 20, 120);
    doc.text(invoice.influencer_email, 20, 128);
    doc.text(`Referentie: ${invoice.influencer_ref}`, 20, 136);

    // Line items table
    const tableData = lineItems.map(item => [
      item.description,
      item.quantity.toString(),
      `€${parseFloat(item.unit_price).toFixed(2)}`,
      `€${parseFloat(item.total_price).toFixed(2)}`
    ]);

    doc.autoTable({
      startY: 150,
      head: [['Omschrijving', 'Aantal', 'Prijs per stuk', 'Totaal']],
      body: tableData,
      theme: 'striped',
      headStyles: {
        fillColor: primaryColor,
        textColor: [255, 255, 255],
        fontSize: 11,
        fontStyle: 'bold'
      },
      bodyStyles: {
        fontSize: 10
      },
      columnStyles: {
        0: { cellWidth: 80 },
        1: { cellWidth: 20, halign: 'center' },
        2: { cellWidth: 30, halign: 'right' },
        3: { cellWidth: 30, halign: 'right' }
      },
      margin: { left: 20, right: 20 }
    });

    // Totals section
    const finalY = doc.lastAutoTable.finalY + 20;
    
    // Totals box
    doc.setFillColor(...lightColor);
    doc.rect(120, finalY, 70, 35, 'F');
    doc.setDrawColor(...darkColor);
    doc.rect(120, finalY, 70, 35, 'S');

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text('Subtotaal:', 125, finalY + 10);
    doc.text(`BTW (${parseFloat(invoice.btw_rate).toFixed(0)}%):`, 125, finalY + 18);
    
    doc.setFont('helvetica', 'bold');
    doc.text('Totaal:', 125, finalY + 28);

    // Amounts
    doc.setFont('helvetica', 'normal');
    doc.text(`€${parseFloat(invoice.subtotal).toFixed(2)}`, 165, finalY + 10);
    doc.text(`€${parseFloat(invoice.btw_amount).toFixed(2)}`, 165, finalY + 18);
    
    doc.setFont('helvetica', 'bold');
    doc.text(`€${parseFloat(invoice.total_amount).toFixed(2)}`, 165, finalY + 28);

    // Payment terms
    const termsY = finalY + 50;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Betalingsvoorwaarden:', 20, termsY);
    
    doc.setFont('helvetica', 'normal');
    const terms = settings.invoice_terms.split('\n');
    let currentY = termsY + 8;
    
    terms.forEach(term => {
      doc.text(term, 20, currentY);
      currentY += 5;
    });

    // Notes section
    if (invoice.notes && invoice.notes.trim()) {
      doc.setFont('helvetica', 'bold');
      doc.text('Opmerkingen:', 20, currentY + 10);
      
      doc.setFont('helvetica', 'normal');
      const notes = invoice.notes.split('\n');
      let notesY = currentY + 18;
      
      notes.forEach(note => {
        doc.text(note, 20, notesY);
        notesY += 5;
      });
    }

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text('Deze factuur is automatisch gegenereerd door Filright Invoice System', 20, 280);
    doc.text(`Gegenereerd op: ${new Date().toLocaleString('nl-NL')}`, 20, 285);

    // Status watermark for draft invoices
    if (invoice.status === 'draft') {
      doc.setTextColor(255, 0, 0);
      doc.setFontSize(40);
      doc.setFont('helvetica', 'bold');
      doc.text('CONCEPT', 105, 150, { angle: 45, align: 'center' });
    }

    // Return PDF as buffer
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));

    // Set headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Factuur_${invoice.invoice_number}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    // Send PDF
    res.status(200).send(pdfBuffer);

    console.log('✅ PDF generated for invoice:', invoice.invoice_number);

  } catch (error) {
    console.error('❌ PDF generation error:', error);
    
    res.status(500).json({
      success: false,
      error: 'PDF generatie error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
} 