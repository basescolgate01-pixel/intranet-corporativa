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

      await client.query(`
        INSERT INTO logs (user_id, action, detail) VALUES (1, 'SYSTEM', 'Base de datos inicializada')
      `);

      console.log('✓ Default data inserted');
    }

    console.log('✓ Database ready');
  } finally {
    client.release();
  }
}

module.exports = { pool, initDB };
