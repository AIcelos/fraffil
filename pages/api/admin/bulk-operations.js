import { sql } from '@vercel/postgres';
import { parse } from 'csv-parse/sync';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
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
    if (req.method === 'GET') {
      // Export all influencers to CSV format
      const result = await sql`
        SELECT ref, name, email, phone, commission, status, instagram, tiktok, youtube, notes, created_at
        FROM influencers 
        ORDER BY created_at DESC
      `;
      
      const influencers = result.rows;
      
      // Convert to CSV format
      const csvHeader = 'ref,name,email,phone,commission,status,instagram,tiktok,youtube,notes,created_at\n';
      const csvData = influencers.map(influencer => {
        return [
          influencer.ref || '',
          influencer.name || '',
          influencer.email || '',
          influencer.phone || '',
          influencer.commission || '6.0',
          influencer.status || 'active',
          influencer.instagram || '',
          influencer.tiktok || '',
          influencer.youtube || '',
          (influencer.notes || '').replace(/,/g, ';'), // Replace commas to avoid CSV issues
          influencer.created_at || ''
        ].join(',');
      }).join('\n');
      
      const csvContent = csvHeader + csvData;
      
      console.log(`📊 CSV Export: ${influencers.length} influencers exported`);
      
      return res.status(200).json({
        success: true,
        data: csvContent,
        count: influencers.length,
        timestamp: new Date().toISOString()
      });
    }

    if (req.method === 'POST') {
      const { operation, data } = req.body;
      
      if (operation === 'import') {
        // CSV Import functionality
        const { csvData } = data;
        
        if (!csvData) {
          return res.status(400).json({
            success: false,
            error: 'Geen CSV data ontvangen'
          });
        }
        
        try {
          // Parse CSV data
          const records = parse(csvData, {
            columns: true,
            skip_empty_lines: true,
            trim: true
          });
          
          console.log(`📥 CSV Import: Processing ${records.length} records`);
          
          let imported = 0;
          let errors = [];
          
          for (const record of records) {
            try {
              // Validate required fields
              if (!record.ref || !record.email) {
                errors.push(`Rij overgeslagen: ref en email zijn verplicht (ref: ${record.ref})`);
                continue;
              }
              
              // Check if influencer already exists
              const existing = await sql`
                SELECT ref FROM influencers WHERE ref = ${record.ref} OR email = ${record.email}
              `;
              
              if (existing.rows.length > 0) {
                errors.push(`Influencer ${record.ref} bestaat al`);
                continue;
              }
              
              // Insert new influencer
              await sql`
                INSERT INTO influencers (
                  ref, name, email, phone, commission, status, 
                  instagram, tiktok, youtube, notes, created_at
                ) VALUES (
                  ${record.ref},
                  ${record.name || record.ref},
                  ${record.email},
                  ${record.phone || ''},
                  ${parseFloat(record.commission) || 6.0},
                  ${record.status || 'active'},
                  ${record.instagram || ''},
                  ${record.tiktok || ''},
                  ${record.youtube || ''},
                  ${record.notes || ''},
                  NOW()
                )
              `;
              
              imported++;
              
            } catch (recordError) {
              console.error(`❌ Error importing record ${record.ref}:`, recordError);
              errors.push(`Fout bij ${record.ref}: ${recordError.message}`);
            }
          }
          
          console.log(`✅ CSV Import completed: ${imported} imported, ${errors.length} errors`);
          
          return res.status(200).json({
            success: true,
            imported: imported,
            errors: errors,
            total: records.length
          });
          
        } catch (parseError) {
          console.error('❌ CSV Parse error:', parseError);
          return res.status(400).json({
            success: false,
            error: 'CSV formaat fout: ' + parseError.message
          });
        }
      }
      
      if (operation === 'bulk_commission_update') {
        // Bulk commission rate updates
        const { influencers, newCommission } = data;
        
        if (!influencers || !Array.isArray(influencers) || !newCommission) {
          return res.status(400).json({
            success: false,
            error: 'Ongeldige data voor bulk commissie update'
          });
        }
        
        console.log(`🔄 Bulk Commission Update: ${influencers.length} influencers to ${newCommission}%`);
        
        let updated = 0;
        let errors = [];
        
        for (const influencerRef of influencers) {
          try {
            const result = await sql`
              UPDATE influencers 
              SET commission = ${parseFloat(newCommission)}
              WHERE ref = ${influencerRef}
            `;
            
            if (result.rowCount > 0) {
              updated++;
            } else {
              errors.push(`Influencer ${influencerRef} niet gevonden`);
            }
            
          } catch (updateError) {
            console.error(`❌ Error updating ${influencerRef}:`, updateError);
            errors.push(`Fout bij ${influencerRef}: ${updateError.message}`);
          }
        }
        
        console.log(`✅ Bulk Commission Update completed: ${updated} updated, ${errors.length} errors`);
        
        return res.status(200).json({
          success: true,
          updated: updated,
          errors: errors,
          total: influencers.length
        });
      }
      
      if (operation === 'bulk_status_update') {
        // Bulk status updates
        const { influencers, newStatus } = data;
        
        if (!influencers || !Array.isArray(influencers) || !newStatus) {
          return res.status(400).json({
            success: false,
            error: 'Ongeldige data voor bulk status update'
          });
        }
        
        console.log(`🔄 Bulk Status Update: ${influencers.length} influencers to ${newStatus}`);
        
        let updated = 0;
        let errors = [];
        
        for (const influencerRef of influencers) {
          try {
            const result = await sql`
              UPDATE influencers 
              SET status = ${newStatus}
              WHERE ref = ${influencerRef}
            `;
            
            if (result.rowCount > 0) {
              updated++;
            } else {
              errors.push(`Influencer ${influencerRef} niet gevonden`);
            }
            
          } catch (updateError) {
            console.error(`❌ Error updating status ${influencerRef}:`, updateError);
            errors.push(`Fout bij ${influencerRef}: ${updateError.message}`);
          }
        }
        
        console.log(`✅ Bulk Status Update completed: ${updated} updated, ${errors.length} errors`);
        
        return res.status(200).json({
          success: true,
          updated: updated,
          errors: errors,
          total: influencers.length
        });
      }
      
      return res.status(400).json({
        success: false,
        error: 'Onbekende operatie'
      });
    }

    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });

  } catch (error) {
    console.error('❌ Bulk operations error:', error);
    
    res.status(500).json({
      success: false,
      error: 'Server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
} 