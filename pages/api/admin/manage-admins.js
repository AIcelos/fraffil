import { sql } from '@vercel/postgres';
import bcrypt from 'bcryptjs';

// Ensure admin_users table exists with all required columns
async function ensureAdminUsersTable() {
  try {
    // Create table if not exists
    await sql`
      CREATE TABLE IF NOT EXISTS admin_users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        role VARCHAR(20) DEFAULT 'admin',
        status VARCHAR(20) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by VARCHAR(50),
        last_login TIMESTAMP,
        notes TEXT
      )
    `;

    // Add missing columns if they don't exist
    const columns = [
      { name: 'email', type: 'VARCHAR(255)' },
      { name: 'status', type: 'VARCHAR(20) DEFAULT \'active\'' },
      { name: 'created_by', type: 'VARCHAR(50)' },
      { name: 'notes', type: 'TEXT' }
    ];

    for (const column of columns) {
      try {
        await sql`ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS ${sql(column.name)} ${sql.unsafe(column.type)}`;
      } catch (error) {
        // Column might already exist, continue
      }
    }

    return { success: true };
  } catch (error) {
    console.error('❌ Error ensuring admin_users table:', error);
    return { success: false, error: error.message };
  }
}

// Get all admin users
async function getAllAdmins() {
  try {
    const result = await sql`
      SELECT id, username, email, role, status, created_at, created_by, last_login, notes
      FROM admin_users 
      ORDER BY created_at DESC
    `;
    return { success: true, data: result.rows };
  } catch (error) {
    console.error('❌ Error fetching admins:', error);
    return { success: false, error: error.message };
  }
}

// Create new admin user
async function createAdmin(adminData, createdBy) {
  try {
    const { username, password, email, role = 'admin', notes = '' } = adminData;

    // Validate required fields
    if (!username || !password) {
      return { success: false, error: 'Username en password zijn verplicht' };
    }

    // Check if username already exists
    const existingUser = await sql`
      SELECT username FROM admin_users 
      WHERE username = ${username.toLowerCase()}
      LIMIT 1
    `;

    if (existingUser.rows.length > 0) {
      return { success: false, error: 'Username bestaat al' };
    }

    // Check if email already exists (if provided)
    if (email) {
      const existingEmail = await sql`
        SELECT email FROM admin_users 
        WHERE email = ${email.toLowerCase()}
        LIMIT 1
      `;

      if (existingEmail.rows.length > 0) {
        return { success: false, error: 'Email adres is al in gebruik' };
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create admin user
    const result = await sql`
      INSERT INTO admin_users (
        username, password_hash, email, role, status, created_by, notes
      ) VALUES (
        ${username.toLowerCase()}, ${hashedPassword}, ${email?.toLowerCase() || null}, 
        ${role}, 'active', ${createdBy}, ${notes}
      ) RETURNING id, username, email, role, status, created_at, created_by
    `;

    const newAdmin = result.rows[0];
    console.log('✅ Admin created:', newAdmin.username);

    return { success: true, data: newAdmin };
  } catch (error) {
    console.error('❌ Error creating admin:', error);
    return { success: false, error: error.message };
  }
}

// Update admin user
async function updateAdmin(adminId, updateData, updatedBy) {
  try {
    const { username, email, role, status, notes, newPassword } = updateData;

    // Build update query dynamically
    let updateFields = [];
    let values = [];

    if (username) {
      // Check if new username is available
      const existingUser = await sql`
        SELECT id FROM admin_users 
        WHERE username = ${username.toLowerCase()} AND id != ${adminId}
        LIMIT 1
      `;
      if (existingUser.rows.length > 0) {
        return { success: false, error: 'Username is al in gebruik' };
      }
      updateFields.push('username = $' + (values.length + 1));
      values.push(username.toLowerCase());
    }

    if (email !== undefined) {
      if (email) {
        // Check if new email is available
        const existingEmail = await sql`
          SELECT id FROM admin_users 
          WHERE email = ${email.toLowerCase()} AND id != ${adminId}
          LIMIT 1
        `;
        if (existingEmail.rows.length > 0) {
          return { success: false, error: 'Email is al in gebruik' };
        }
      }
      updateFields.push('email = $' + (values.length + 1));
      values.push(email?.toLowerCase() || null);
    }

    if (role) {
      updateFields.push('role = $' + (values.length + 1));
      values.push(role);
    }

    if (status) {
      updateFields.push('status = $' + (values.length + 1));
      values.push(status);
    }

    if (notes !== undefined) {
      updateFields.push('notes = $' + (values.length + 1));
      values.push(notes);
    }

    if (newPassword) {
      const hashedPassword = await bcrypt.hash(newPassword, 12);
      updateFields.push('password_hash = $' + (values.length + 1));
      values.push(hashedPassword);
    }

    if (updateFields.length === 0) {
      return { success: false, error: 'Geen velden om bij te werken' };
    }

    // Add updated_at and updated_by
    updateFields.push('updated_at = NOW()');
    updateFields.push('updated_by = $' + (values.length + 1));
    values.push(updatedBy);

    // Execute update
    const query = `
      UPDATE admin_users 
      SET ${updateFields.join(', ')}
      WHERE id = $${values.length + 1}
      RETURNING id, username, email, role, status, created_at, updated_at, created_by
    `;
    values.push(adminId);

    const result = await sql.unsafe(query, values);

    if (result.rows.length === 0) {
      return { success: false, error: 'Admin niet gevonden' };
    }

    console.log('✅ Admin updated:', result.rows[0].username);
    return { success: true, data: result.rows[0] };
  } catch (error) {
    console.error('❌ Error updating admin:', error);
    return { success: false, error: error.message };
  }
}

// Delete admin user (soft delete by setting status to inactive)
async function deleteAdmin(adminId, deletedBy) {
  try {
    // Don't allow deleting the last admin
    const adminCount = await sql`
      SELECT COUNT(*) as count FROM admin_users 
      WHERE status = 'active'
    `;

    if (adminCount.rows[0].count <= 1) {
      return { success: false, error: 'Kan de laatste actieve admin niet verwijderen' };
    }

    // Soft delete by setting status to inactive
    const result = await sql`
      UPDATE admin_users 
      SET status = 'inactive', 
          updated_at = NOW(),
          updated_by = ${deletedBy},
          notes = COALESCE(notes, '') || ' [Gedeactiveerd op ' || NOW() || ']'
      WHERE id = ${adminId}
      RETURNING username, email
    `;

    if (result.rows.length === 0) {
      return { success: false, error: 'Admin niet gevonden' };
    }

    console.log('✅ Admin deactivated:', result.rows[0].username);
    return { success: true, data: result.rows[0] };
  } catch (error) {
    console.error('❌ Error deleting admin:', error);
    return { success: false, error: error.message };
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

  try {
    // Ensure table exists
    const tableResult = await ensureAdminUsersTable();
    if (!tableResult.success) {
      return res.status(500).json({
        success: false,
        error: 'Database setup failed: ' + tableResult.error
      });
    }

    // For now, we'll use a simple auth check
    // TODO: Implement proper session validation
    const currentUser = 'sven'; // This should come from session validation

    switch (req.method) {
      case 'GET':
        // Get all admins
        const admins = await getAllAdmins();
        if (!admins.success) {
          return res.status(500).json(admins);
        }
        return res.status(200).json({
          success: true,
          data: admins.data,
          count: admins.data.length
        });

      case 'POST':
        // Create new admin
        const createResult = await createAdmin(req.body, currentUser);
        if (!createResult.success) {
          return res.status(400).json(createResult);
        }
        return res.status(201).json(createResult);

      case 'PUT':
        // Update admin
        const { adminId, ...updateData } = req.body;
        if (!adminId) {
          return res.status(400).json({
            success: false,
            error: 'Admin ID is verplicht'
          });
        }
        const updateResult = await updateAdmin(adminId, updateData, currentUser);
        if (!updateResult.success) {
          return res.status(400).json(updateResult);
        }
        return res.status(200).json(updateResult);

      case 'DELETE':
        // Delete admin
        const { adminId: deleteId } = req.body;
        if (!deleteId) {
          return res.status(400).json({
            success: false,
            error: 'Admin ID is verplicht'
          });
        }
        const deleteResult = await deleteAdmin(deleteId, currentUser);
        if (!deleteResult.success) {
          return res.status(400).json(deleteResult);
        }
        return res.status(200).json(deleteResult);

      default:
        return res.status(405).json({
          success: false,
          error: 'Method not allowed'
        });
    }

  } catch (error) {
    console.error('❌ Admin management error:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
} 