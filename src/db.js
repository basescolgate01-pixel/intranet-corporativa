const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function initDB() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(100) NOT NULL,
        role VARCHAR(20) DEFAULT 'user',
        email VARCHAR(100),
        department VARCHAR(100),
        avatar VARCHAR(10),
        profile_photo TEXT,
        active BOOLEAN DEFAULT true,
        created_at DATE DEFAULT CURRENT_DATE
      );

      CREATE TABLE IF NOT EXISTS panels (
        id SERIAL PRIMARY KEY,
        title VARCHAR(200) NOT NULL,
        description TEXT,
        embed_url TEXT,
        category VARCHAR(100),
        icon VARCHAR(10) DEFAULT '📊',
        icon_url TEXT,
        color VARCHAR(20) DEFAULT '#E3000F',
        created_at DATE DEFAULT CURRENT_DATE,
        created_by INTEGER REFERENCES users(id) ON DELETE SET NULL
      );

      CREATE TABLE IF NOT EXISTS permissions (
        id SERIAL PRIMARY KEY,
        panel_id INTEGER REFERENCES panels(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE(panel_id, user_id)
      );

      CREATE TABLE IF NOT EXISTS favorites (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        panel_id INTEGER REFERENCES panels(id) ON DELETE CASCADE,
        UNIQUE(user_id, panel_id)
      );

      CREATE TABLE IF NOT EXISTS logs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        action VARCHAR(50) NOT NULL,
        detail TEXT,
        ts TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        type VARCHAR(50),
        message TEXT,
        read BOOLEAN DEFAULT false,
        ts TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS menu_items (
        id SERIAL PRIMARY KEY,
        label VARCHAR(100) NOT NULL,
        icon VARCHAR(50) DEFAULT '',
        path VARCHAR(255) NOT NULL,
        parent_id INTEGER REFERENCES menu_items(id) ON DELETE CASCADE,
        order_index INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        created_at DATE DEFAULT CURRENT_DATE,
        created_by INTEGER REFERENCES users(id) ON DELETE SET NULL
      );

      CREATE TABLE IF NOT EXISTS menu_user_access (
        id SERIAL PRIMARY KEY,
        menu_item_id INTEGER REFERENCES menu_items(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE(menu_item_id, user_id)
      );
    `);

    // Insert default admin if not exists
    const adminCheck = await client.query("SELECT id FROM users WHERE username = 'admin'");
    if (adminCheck.rows.length === 0) {
      const bcrypt = require('bcryptjs');
      const hash = await bcrypt.hash('Admin2025!', 10);
      await client.query(`
        INSERT INTO users (username, password, name, role, email, department, avatar, active)
        VALUES ('admin', $1, 'Administrador General', 'admin', 'admin@empresa.com', 'TI / Sistemas', 'A', true)
      `, [hash]);

      // Insert default users
      const users = [
        ['jlopez',     'Pass123!', 'Juan López',       'user', 'jlopez@empresa.com',     'Ventas',    'JL'],
        ['mgarcia',    'Pass123!', 'María García',      'user', 'mgarcia@empresa.com',    'Marketing', 'MG'],
        ['crodriguez', 'Pass123!', 'Carlos Rodríguez',  'user', 'crodriguez@empresa.com', 'Finanzas',  'CR'],
      ];
      for (const u of users) {
        const h = await bcrypt.hash(u[1], 10);
        await client.query(`
          INSERT INTO users (username, password, name, role, email, department, avatar, active)
          VALUES ($1, $2, $3, $4, $5, $6, $7, true)
          ON CONFLICT (username) DO NOTHING
        `, [u[0], h, u[2], u[3], u[4], u[5], u[6]]);
      }

      // Insert default panels
      const panelRes = await client.query(`
        INSERT INTO panels (title, description, embed_url, category, icon, color, created_by)
        VALUES
          ('Dashboard de Ventas',   'KPIs y métricas de ventas en tiempo real', 'https://app.powerbi.com/reportEmbed?reportId=DEMO1', 'Ventas',    '📊', '#E3000F', 1),
          ('Análisis de Marketing', 'Campañas, alcance y conversiones',          'https://app.powerbi.com/reportEmbed?reportId=DEMO2', 'Marketing', '📈', '#2563EB', 1),
          ('Reporte Financiero',    'P&L, flujo de caja y presupuesto',          'https://app.powerbi.com/reportEmbed?reportId=DEMO3', 'Finanzas',  '💰', '#1A9B3C', 1)
        RETURNING id
      `);

      // Add default permissions (admin gets all)
      for (const p of panelRes.rows) {
        await client.query(`INSERT INTO permissions (panel_id, user_id) VALUES ($1, 1) ON CONFLICT DO NOTHING`, [p.id]);
      }

      // Insert default menu items
      const menuRes = await client.query(`
        INSERT INTO menu_items (label, icon, path, parent_id, order_index, is_active, created_by)
        VALUES
          ('Mis Paneles', 'grid', 'pages/panels.html', NULL, 1, true, 1),
          ('Dashboard', 'activity', 'pages/dashboard.html', NULL, 2, true, 1),
          ('Usuarios', 'users', 'pages/users.html', NULL, 3, true, 1),
          ('Permisos', 'lock', 'pages/permissions.html', NULL, 4, true, 1),
          ('Registro', 'file-text', 'pages/logs.html', NULL, 5, true, 1),
          ('Analytics', 'chart', 'pages/admin-analytics.html', NULL, 6, true, 1)
        RETURNING id
      `);

      // Add default menu access for admin (gets all)
      for (const m of menuRes.rows) {
        await client.query(`INSERT INTO menu_user_access (menu_item_id, user_id) VALUES ($1, 1) ON CONFLICT DO NOTHING`, [m.id]);
      }

      // Add menu access for regular users (only Mis Paneles and their assigned items)
      const usersRes = await client.query('SELECT id FROM users WHERE role = $1', ['user']);
      for (const u of usersRes.rows) {
        await client.query(`INSERT INTO menu_user_access (menu_item_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`, [menuRes.rows[0].id, u.id]);
      }

      await client.query(`
        INSERT INTO logs (user_id, action, detail) VALUES (1, 'SYSTEM', 'Base de datos inicializada')
      `);

      console.log('✓ Default data inserted');
    } else {
      // Si la BD ya existe, verifica si menu_items está vacía
      // Si está vacía, inserta los menús por defecto (migración)
      const menuCount = await client.query('SELECT COUNT(*) as count FROM menu_items');
      if (parseInt(menuCount.rows[0].count) === 0) {
        console.log('→ Inserting default menu items (migration)...');
        const menuRes = await client.query(`
          INSERT INTO menu_items (label, icon, path, parent_id, order_index, is_active, created_by)
          VALUES
            ('Mis Paneles', 'grid', '/pages/panels.html', NULL, 1, true, 1),
            ('Dashboard', 'activity', '/pages/dashboard.html', NULL, 2, true, 1),
            ('Usuarios', 'users', '/pages/users.html', NULL, 3, true, 1),
            ('Permisos', 'lock', '/pages/permissions.html', NULL, 4, true, 1),
            ('Registro', 'file-text', '/pages/logs.html', NULL, 5, true, 1)
          RETURNING id
        `);

        // Add default menu access for admin
        for (const m of menuRes.rows) {
          await client.query(`INSERT INTO menu_user_access (menu_item_id, user_id) VALUES ($1, 1) ON CONFLICT DO NOTHING`, [m.id]);
        }

        // Add menu access for regular users
        const usersRes = await client.query('SELECT id FROM users WHERE role = $1', ['user']);
        for (const u of usersRes.rows) {
          await client.query(`INSERT INTO menu_user_access (menu_item_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`, [menuRes.rows[0].id, u.id]);
        }

        console.log('✓ Menu items migrated');
      }
    }

    console.log('✓ Database ready');
  } finally {
    client.release();
  }
}

// Ensure all default menu items exist (idempotent — safe to run on every startup)
async function ensureDefaultMenuItems() {
  const client = await pool.connect();
  try {
    const defaults = [
      { label: 'Mis Paneles', icon: 'grid',       path: 'pages/panels.html',          order_index: 1 },
      { label: 'Dashboard',   icon: 'activity',   path: 'pages/dashboard.html',       order_index: 2 },
      { label: 'Usuarios',    icon: 'users',      path: 'pages/users.html',           order_index: 3 },
      { label: 'Permisos',    icon: 'lock',       path: 'pages/permissions.html',     order_index: 4 },
      { label: 'Registro',    icon: 'file-text',  path: 'pages/logs.html',            order_index: 5 },
      { label: 'Analytics',   icon: 'chart',      path: 'pages/admin-analytics.html', order_index: 6 },
    ];

    for (const item of defaults) {
      const existing = await client.query('SELECT id FROM menu_items WHERE label = $1', [item.label]);
      if (existing.rows.length === 0) {
        const res = await client.query(
          `INSERT INTO menu_items (label, icon, path, parent_id, order_index, is_active, created_by)
           VALUES ($1, $2, $3, NULL, $4, true, 1) RETURNING id`,
          [item.label, item.icon, item.path, item.order_index]
        );
        await client.query(
          'INSERT INTO menu_user_access (menu_item_id, user_id) VALUES ($1, 1) ON CONFLICT DO NOTHING',
          [res.rows[0].id]
        );
        console.log(`→ Created default menu item: ${item.label}`);
      }
    }
    console.log('✓ Default menu items verified');
  } catch (e) {
    console.error('Error ensuring default menu items:', e.message);
  } finally {
    client.release();
  }
}

// Ensure Analytics menu item exists (for backwards compatibility with existing DBs)
async function ensureAnalyticsMenu() {
  const client = await pool.connect();
  try {
    // Check if Analytics menu item already exists
    const existing = await client.query(
      "SELECT id FROM menu_items WHERE label = 'Analytics'"
    );

    if (existing.rows.length === 0) {
      console.log('→ Creating Analytics menu item...');

      // Create Analytics menu item
      const menuRes = await client.query(`
        INSERT INTO menu_items (label, icon, path, parent_id, order_index, is_active, created_by)
        VALUES ('Analytics', 'chart', 'pages/admin-analytics.html', NULL, 6, true, 1)
        RETURNING id
      `);

      const analyticsMenuId = menuRes.rows[0].id;

      // Assign to admin user (ID 1)
      await client.query(
        'INSERT INTO menu_user_access (menu_item_id, user_id) VALUES ($1, 1) ON CONFLICT DO NOTHING',
        [analyticsMenuId]
      );

      // Log the action
      await client.query(
        "INSERT INTO logs (user_id, action, detail) VALUES (1, 'SYSTEM', 'Analytics menu item created')"
      );

      console.log('✓ Analytics menu item created');
    }
  } catch (e) {
    console.error('Error ensuring Analytics menu:', e.message);
  } finally {
    client.release();
  }
}

module.exports = { pool, initDB, ensureAnalyticsMenu, ensureDefaultMenuItems };
