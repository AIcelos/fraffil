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

    // Add missing columns if they don't exist - FIXED: Use proper SQL syntax
    try {
      await sql`ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS email VARCHAR(255)`;
      await sql`ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active'`;
      await sql`ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS created_by VARCHAR(50)`;
      await sql`ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS notes TEXT`;
    } catch (error) {
      console.log('⚠️ Some columns might already exist:', error.message);
    }

    return { success: true };
  } catch (error) {
    console.error('❌ Error ensuring admin_users table:', error);
    return { success: false, error: error.message };
  }
}

// Get all admin users - FIXED: Handle missing columns gracefully
async function getAllAdmins() {
  try {
    // First check what columns exist
    const tableInfo = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'admin_users'
    `;
    
    const columns = tableInfo.rows.map(row => row.column_name);
    console.log('📊 Available columns:', columns);

    // Build query based on available columns
    let query = `SELECT id, username, password_hash, created_at`;
    
    if (columns.includes('email')) query += `, email`;
    if (columns.includes('role')) query += `, role`;
    if (columns.includes('status')) query += `, status`;
    if (columns.includes('created_by')) query += `, created_by`;
    if (columns.includes('last_login')) query += `, last_login`;
    if (columns.includes('notes')) query += `, notes`;
    
    query += ` FROM admin_users ORDER BY created_at DESC`;

    const result = await sql.unsafe(query);
    
    // Fill in missing fields with defaults
    const admins = result.rows.map(admin => ({
      id: admin.id,
      username: admin.username,
      email: admin.email || null,
      role: admin.role || 'admin',
      status: admin.status || 'active',
      created_at: admin.created_at,
      created_by: admin.created_by || null,
      last_login: admin.last_login || null,
      notes: admin.notes || null
    }));

    return { success: true, data: admins };
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

    // Check if email already exists (if provided and column exists)
    if (email) {
      try {
        const existingEmail = await sql`
          SELECT email FROM admin_users 
          WHERE email = ${email.toLowerCase()}
          LIMIT 1
        `;

        if (existingEmail.rows.length > 0) {
          return { success: false, error: 'Email adres is al in gebruik' };
        }
      } catch (error) {
        console.log('⚠️ Email column check failed, continuing without email validation');
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create admin user - use basic insert first
    const result = await sql`
      INSERT INTO admin_users (username, password_hash) 
      VALUES (${username.toLowerCase()}, ${hashedPassword}) 
      RETURNING id, username, created_at
    `;

    const newAdmin = result.rows[0];

    // Try to update with additional fields if columns exist
    if (email || role !== 'admin' || notes || createdBy) {
      try {
        await sql`
          UPDATE admin_users 
          SET email = ${email?.toLowerCase() || null},
              role = ${role},
              status = 'active',
              created_by = ${createdBy},
              notes = ${notes}
          WHERE id = ${newAdmin.id}
        `;
      } catch (updateError) {
        console.log('⚠️ Could not update additional fields:', updateError.message);
      }
    }

    console.log('✅ Admin created:', newAdmin.username);

    return { success: true, data: newAdmin };
  } catch (error) {
    console.error('❌ Error creating admin:', error);
    return { success: false, error: error.message };
  }
}

// Update admin user - SIMPLIFIED
async function updateAdmin(adminId, updateData, updatedBy) {
  try {
    const { username, email, role, status, notes, newPassword } = updateData;

    // Start with basic fields that should always exist
    let updates = [];
    let values = [];
    let paramCount = 0;

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
      updates.push(`username = $${++paramCount}`);
      values.push(username.toLowerCase());
    }

    if (newPassword) {
      const hashedPassword = await bcrypt.hash(newPassword, 12);
      updates.push(`password_hash = $${++paramCount}`);
      values.push(hashedPassword);
    }

    // Try to update optional fields
    if (email !== undefined) {
      updates.push(`email = $${++paramCount}`);
      values.push(email?.toLowerCase() || null);
    }

    if (role) {
      updates.push(`role = $${++paramCount}`);
      values.push(role);
    }

    if (status) {
      updates.push(`status = $${++paramCount}`);
      values.push(status);
    }

    if (notes !== undefined) {
      updates.push(`notes = $${++paramCount}`);
      values.push(notes);
    }

    if (updates.length === 0) {
      return { success: false, error: 'Geen velden om bij te werken' };
    }

    // Execute update
    const query = `
      UPDATE admin_users 
      SET ${updates.join(', ')}
      WHERE id = $${++paramCount}
      RETURNING id, username, created_at
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
      WHERE status = 'active' OR status IS NULL
    `;

    if (adminCount.rows[0].count <= 1) {
      return { success: false, error: 'Kan de laatste actieve admin niet verwijderen' };
    }

    // Try soft delete first
    try {
      const result = await sql`
        UPDATE admin_users 
        SET status = 'inactive'
        WHERE id = ${adminId}
        RETURNING username
      `;

      if (result.rows.length === 0) {
        return { success: false, error: 'Admin niet gevonden' };
      }

      console.log('✅ Admin deactivated:', result.rows[0].username);
      return { success: true, data: result.rows[0] };
    } catch (error) {
      // If status column doesn't exist, we can't soft delete
      console.log('⚠️ Cannot soft delete, status column missing');
      return { success: false, error: 'Deactivatie niet mogelijk - database schema incomplete' };
    }
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