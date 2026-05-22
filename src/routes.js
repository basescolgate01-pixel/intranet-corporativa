const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('./db');
const { authMiddleware, adminOnly } = require('./middleware');

const router = express.Router();

// ============================================================
// AUTH
// ============================================================

// POST /api/auth/login
router.post('/auth/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    const user = result.rows[0];
    if (!user) return res.status(401).json({ error: 'Usuario no encontrado' });
    if (!user.active) return res.status(401).json({ error: 'Usuario desactivado' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Contraseña incorrecta' });

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    // Log login
    await pool.query('INSERT INTO logs (user_id, action, detail) VALUES ($1, $2, $3)', [user.id, 'LOGIN', 'Inicio de sesión']);

    const { password: _, ...safeUser } = user;
    res.json({ token, user: safeUser });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// ============================================================
// USERS
// ============================================================

// GET /api/users
router.get('/users', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query('SELECT id, username, name, role, email, department, avatar, profile_photo, active, created_at FROM users ORDER BY id');
    res.json(result.rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/users/:id
router.get('/users/:id', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query('SELECT id, username, name, role, email, department, avatar, profile_photo, active, created_at FROM users WHERE id = $1', [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json(result.rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/users
router.post('/users', authMiddleware, adminOnly, async (req, res) => {
  const { username, password, name, role, email, department, avatar } = req.body;
  try {
    const hash = await bcrypt.hash(password, 10);
    const initials = avatar || name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
    const result = await pool.query(
      'INSERT INTO users (username, password, name, role, email, department, avatar) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id, username, name, role, email, department, avatar, active, created_at',
      [username, hash, name, role || 'user', email, department, initials]
    );
    await pool.query('INSERT INTO logs (user_id, action, detail) VALUES ($1,$2,$3)', [req.user.id, 'CREATE_USER', `Creó usuario: ${username}`]);
    res.status(201).json(result.rows[0]);
  } catch (e) {
    if (e.code === '23505') return res.status(400).json({ error: 'El usuario ya existe' });
    res.status(500).json({ error: e.message });
  }
});

// PUT /api/users/:id
router.put('/users/:id', authMiddleware, adminOnly, async (req, res) => {
  const { username, password, name, role, email, department, avatar, active } = req.body;
  try {
    let query, params;
    if (password) {
      const hash = await bcrypt.hash(password, 10);
      query = 'UPDATE users SET username=$1, password=$2, name=$3, role=$4, email=$5, department=$6, avatar=$7, active=$8 WHERE id=$9 RETURNING id, username, name, role, email, department, avatar, active';
      params = [username, hash, name, role, email, department, avatar, active, req.params.id];
    } else {
      query = 'UPDATE users SET username=$1, name=$2, role=$3, email=$4, department=$5, avatar=$6, active=$7 WHERE id=$8 RETURNING id, username, name, role, email, department, avatar, active';
      params = [username, name, role, email, department, avatar, active, req.params.id];
    }
    const result = await pool.query(query, params);
    if (!result.rows[0]) return res.status(404).json({ error: 'Usuario no encontrado' });
    await pool.query('INSERT INTO logs (user_id, action, detail) VALUES ($1,$2,$3)', [req.user.id, 'UPDATE_USER', `Actualizó usuario: ${username}`]);
    res.json(result.rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// DELETE /api/users/:id
router.delete('/users/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    const u = await pool.query('SELECT username FROM users WHERE id = $1', [req.params.id]);
    await pool.query('DELETE FROM users WHERE id = $1', [req.params.id]);
    await pool.query('INSERT INTO logs (user_id, action, detail) VALUES ($1,$2,$3)', [req.user.id, 'DELETE_USER', `Eliminó usuario: ${u.rows[0]?.username}`]);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// PATCH /api/users/:id/toggle
router.patch('/users/:id/toggle', authMiddleware, adminOnly, async (req, res) => {
  const { active } = req.body;
  try {
    await pool.query('UPDATE users SET active = $1 WHERE id = $2', [active, req.params.id]);
    await pool.query('INSERT INTO logs (user_id, action, detail) VALUES ($1,$2,$3)', [req.user.id, 'UPDATE_USER', `${active ? 'Activó' : 'Desactivó'} usuario ID: ${req.params.id}`]);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ============================================================
// PANELS
// ============================================================

// GET /api/panels
router.get('/panels', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM panels ORDER BY id');
    res.json(result.rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/panels/:id
router.get('/panels/:id', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM panels WHERE id = $1', [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'Panel no encontrado' });
    res.json(result.rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/panels/user/:userId
router.get('/panels/user/:userId', authMiddleware, async (req, res) => {
  try {
    // Admin siempre ve todos los paneles
    const userCheck = await pool.query('SELECT role FROM users WHERE id = $1', [req.params.userId]);
    const isAdmin = userCheck.rows[0]?.role === 'admin';

    const result = isAdmin
      ? await pool.query('SELECT * FROM panels ORDER BY id')
      : await pool.query(`
          SELECT p.* FROM panels p
          INNER JOIN permissions perm ON p.id = perm.panel_id
          WHERE perm.user_id = $1
          ORDER BY p.id
        `, [req.params.userId]);

    res.json(result.rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/panels
router.post('/panels', authMiddleware, adminOnly, async (req, res) => {
  const { title, description, embed_url, category, icon, icon_url, color } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO panels (title, description, embed_url, category, icon, icon_url, color, created_by) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *',
      [title, description, embed_url, category, icon || '📊', icon_url, color || '#E3000F', req.user.id]
    );
    // Give admin access automatically
    await pool.query('INSERT INTO permissions (panel_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [result.rows[0].id, req.user.id]);
    await pool.query('INSERT INTO logs (user_id, action, detail) VALUES ($1,$2,$3)', [req.user.id, 'CREATE_PANEL', `Creó panel: ${title}`]);
    res.status(201).json(result.rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// PUT /api/panels/:id
router.put('/panels/:id', authMiddleware, adminOnly, async (req, res) => {
  const { title, description, embed_url, category, icon, icon_url, color } = req.body;
  try {
    const result = await pool.query(
      'UPDATE panels SET title=$1, description=$2, embed_url=$3, category=$4, icon=$5, icon_url=$6, color=$7 WHERE id=$8 RETURNING *',
      [title, description, embed_url, category, icon, icon_url, color, req.params.id]
    );
    await pool.query('INSERT INTO logs (user_id, action, detail) VALUES ($1,$2,$3)', [req.user.id, 'UPDATE_PANEL', `Actualizó panel: ${title}`]);
    res.json(result.rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// DELETE /api/panels/:id
router.delete('/panels/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    const p = await pool.query('SELECT title FROM panels WHERE id = $1', [req.params.id]);
    await pool.query('DELETE FROM panels WHERE id = $1', [req.params.id]);
    await pool.query('INSERT INTO logs (user_id, action, detail) VALUES ($1,$2,$3)', [req.user.id, 'DELETE_PANEL', `Eliminó panel: ${p.rows[0]?.title}`]);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ============================================================
// PERMISSIONS
// ============================================================

// GET /api/permissions/:panelId
router.get('/permissions/:panelId', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query('SELECT user_id FROM permissions WHERE panel_id = $1', [req.params.panelId]);
    res.json(result.rows.map(r => r.user_id));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/permissions/:panelId  — replace all permissions for a panel
router.post('/permissions/:panelId', authMiddleware, adminOnly, async (req, res) => {
  const { userIds } = req.body; // array of user ids
  const panelId = req.params.panelId;
  try {
    await pool.query('DELETE FROM permissions WHERE panel_id = $1', [panelId]);
    for (const uid of userIds) {
      await pool.query('INSERT INTO permissions (panel_id, user_id) VALUES ($1,$2) ON CONFLICT DO NOTHING', [panelId, uid]);
    }
    await pool.query('INSERT INTO logs (user_id, action, detail) VALUES ($1,$2,$3)', [req.user.id, 'UPDATE_PERM', `Actualizó permisos del panel ID: ${panelId}`]);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ============================================================
// FAVORITES
// ============================================================

// GET /api/favorites/:userId
router.get('/favorites/:userId', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query('SELECT panel_id FROM favorites WHERE user_id = $1', [req.params.userId]);
    res.json(result.rows.map(r => r.panel_id));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/favorites/toggle
router.post('/favorites/toggle', authMiddleware, async (req, res) => {
  const { userId, panelId } = req.body;
  try {
    const exists = await pool.query('SELECT id FROM favorites WHERE user_id=$1 AND panel_id=$2', [userId, panelId]);
    if (exists.rows.length > 0) {
      await pool.query('DELETE FROM favorites WHERE user_id=$1 AND panel_id=$2', [userId, panelId]);
      res.json({ added: false });
    } else {
      await pool.query('INSERT INTO favorites (user_id, panel_id) VALUES ($1,$2)', [userId, panelId]);
      res.json({ added: true });
    }
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ============================================================
// LOGS
// ============================================================

// GET /api/logs
router.get('/logs', authMiddleware, adminOnly, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT l.*, u.name as user_name, u.avatar, u.id as user_id
      FROM logs l
      LEFT JOIN users u ON l.user_id = u.id
      ORDER BY l.ts DESC
      LIMIT 500
    `);
    res.json(result.rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ============================================================
// NOTIFICATIONS
// ============================================================

// GET /api/notifications/:userId
router.get('/notifications/:userId', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM notifications WHERE user_id = $1 ORDER BY ts DESC LIMIT 50',
      [req.params.userId]
    );
    res.json(result.rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/notifications/:userId/unread
router.get('/notifications/:userId/unread', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND read = false',
      [req.params.userId]
    );
    res.json({ count: parseInt(result.rows[0].count) });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// PATCH /api/notifications/:userId/read-all
router.patch('/notifications/:userId/read-all', authMiddleware, async (req, res) => {
  try {
    await pool.query('UPDATE notifications SET read = true WHERE user_id = $1', [req.params.userId]);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ============================================================
// MENU ITEMS (DINÁMICOS)
// ============================================================

// GET /api/menu — Obtener todos los ítems de menú (admin only)
router.get('/menu', authMiddleware, adminOnly, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM menu_items ORDER BY order_index, id');
    res.json(result.rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/menu/user/:userId — Obtener ítems de menú accesibles para un usuario
router.get('/menu/user/:userId', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT m.* FROM menu_items m
      INNER JOIN menu_user_access mp ON m.id = mp.menu_item_id
      WHERE mp.user_id = $1 AND m.is_active = true
      ORDER BY m.order_index, m.id
    `, [req.params.userId]);
    res.json(result.rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/menu — Crear nuevo ítem de menú (admin only)
router.post('/menu', authMiddleware, adminOnly, async (req, res) => {
  const { label, icon, path, parent_id, order_index, is_active } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO menu_items (label, icon, path, parent_id, order_index, is_active, created_by) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *',
      [label, icon || '', path || '#', parent_id || null, order_index || 0, is_active !== false, req.user.id]
    );

    // Asignar automáticamente al admin que lo crea
    const menuId = result.rows[0].id;
    await pool.query('INSERT INTO menu_user_access (menu_item_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [menuId, req.user.id]);

    await pool.query('INSERT INTO logs (user_id, action, detail) VALUES ($1,$2,$3)', [req.user.id, 'CREATE_MENU', `Creó ítem de menú: ${label}`]);
    res.status(201).json(result.rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// PUT /api/menu/:id — Actualizar ítem de menú (admin only)
router.put('/menu/:id', authMiddleware, adminOnly, async (req, res) => {
  const { label, icon, path, parent_id, order_index, is_active } = req.body;
  try {
    const result = await pool.query(
      'UPDATE menu_items SET label=$1, icon=$2, path=$3, parent_id=$4, order_index=$5, is_active=$6 WHERE id=$7 RETURNING *',
      [label, icon || '', path || '#', parent_id || null, order_index || 0, is_active !== false, req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Ítem de menú no encontrado' });
    await pool.query('INSERT INTO logs (user_id, action, detail) VALUES ($1,$2,$3)', [req.user.id, 'UPDATE_MENU', `Actualizó ítem de menú: ${label}`]);
    res.json(result.rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// DELETE /api/menu/:id — Eliminar ítem de menú (admin only)
router.delete('/menu/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    const m = await pool.query('SELECT label FROM menu_items WHERE id = $1', [req.params.id]);
    await pool.query('DELETE FROM menu_items WHERE id = $1', [req.params.id]);
    await pool.query('INSERT INTO logs (user_id, action, detail) VALUES ($1,$2,$3)', [req.user.id, 'DELETE_MENU', `Eliminó ítem de menú: ${m.rows[0]?.label}`]);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ============================================================
// MENU USER ACCESS (Asignar menús a usuarios)
// ============================================================

// GET /api/menu-permissions/user/:userId — Obtener ítems de menú asignados a un usuario (admin only)
router.get('/menu-permissions/user/:userId', authMiddleware, adminOnly, async (req, res) => {
  try {
    const result = await pool.query('SELECT menu_item_id FROM menu_user_access WHERE user_id = $1', [req.params.userId]);
    res.json(result.rows.map(r => r.menu_item_id));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/menu-permissions/user/:userId — Asignar ítems de menú a un usuario (admin only)
router.post('/menu-permissions/user/:userId', authMiddleware, adminOnly, async (req, res) => {
  const { menuItemIds } = req.body; // array de ids de items de menú
  const userId = req.params.userId;
  try {
    // Eliminar accesos previos
    await pool.query('DELETE FROM menu_user_access WHERE user_id = $1', [userId]);
    // Agregar nuevos accesos
    for (const itemId of menuItemIds) {
      await pool.query('INSERT INTO menu_user_access (menu_item_id, user_id) VALUES ($1,$2) ON CONFLICT DO NOTHING', [itemId, userId]);
    }
    await pool.query('INSERT INTO logs (user_id, action, detail) VALUES ($1,$2,$3)', [req.user.id, 'UPDATE_MENU_PERM', `Actualizó permisos de menú para usuario ID: ${userId}`]);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ============================================================
// ANALYTICS (Dashboard Admin)
// ============================================================

// GET /api/analytics/users-stats — Estadísticas de usuarios (admin only)
router.get('/analytics/users-stats', authMiddleware, adminOnly, async (req, res) => {
  try {
    const total = await pool.query('SELECT COUNT(*) as count FROM users');
    const active = await pool.query('SELECT COUNT(*) as count FROM users WHERE active = true');
    const byRole = await pool.query('SELECT role, COUNT(*) as count FROM users GROUP BY role');
    const lastLogin = await pool.query(`
      SELECT u.id, u.name, u.username, MAX(l.ts) as last_login
      FROM users u
      LEFT JOIN logs l ON u.id = l.user_id AND l.action = 'LOGIN'
      GROUP BY u.id, u.name, u.username
      ORDER BY last_login DESC
      LIMIT 10
    `);

    res.json({
      total: parseInt(total.rows[0].count),
      active: parseInt(active.rows[0].count),
      inactive: parseInt(total.rows[0].count) - parseInt(active.rows[0].count),
      byRole: byRole.rows,
      lastLogin: lastLogin.rows
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/analytics/panels-stats — Estadísticas de paneles (admin only)
router.get('/analytics/panels-stats', authMiddleware, adminOnly, async (req, res) => {
  try {
    const total = await pool.query('SELECT COUNT(*) as count FROM panels');
    const byCategory = await pool.query('SELECT category, COUNT(*) as count FROM panels GROUP BY category');
    const topPanels = await pool.query(`
      SELECT p.id, p.title, COUNT(l.id) as views
      FROM panels p
      LEFT JOIN logs l ON l.detail LIKE '%' || p.title || '%' AND l.action = 'VIEW_PANEL'
      GROUP BY p.id, p.title
      ORDER BY views DESC
      LIMIT 10
    `);
    const userAccess = await pool.query(`
      SELECT p.id, p.title, COUNT(pm.user_id) as users_with_access
      FROM panels p
      LEFT JOIN permissions pm ON p.id = pm.panel_id
      GROUP BY p.id, p.title
      ORDER BY users_with_access DESC
    `);

    res.json({
      total: parseInt(total.rows[0].count),
      byCategory: byCategory.rows,
      topPanels: topPanels.rows,
      userAccess: userAccess.rows
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/analytics/activity-timeline — Línea de tiempo de actividad (últimos 30 días) (admin only)
router.get('/analytics/activity-timeline', authMiddleware, adminOnly, async (req, res) => {
  try {
    const timeline = await pool.query(`
      SELECT DATE(ts) as date, COUNT(*) as count
      FROM logs
      WHERE ts >= NOW() - INTERVAL '30 days'
      GROUP BY DATE(ts)
      ORDER BY date ASC
    `);

    res.json(timeline.rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/analytics/hourly-activity — Actividad por hora del día (admin only)
router.get('/analytics/hourly-activity', authMiddleware, adminOnly, async (req, res) => {
  try {
    const hourly = await pool.query(`
      SELECT EXTRACT(HOUR FROM ts) as hour, COUNT(*) as count
      FROM logs
      WHERE ts >= NOW() - INTERVAL '30 days'
      GROUP BY EXTRACT(HOUR FROM ts)
      ORDER BY hour ASC
    `);

    res.json(hourly.rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/analytics/action-breakdown — Desglose de acciones (admin only)
router.get('/analytics/action-breakdown', authMiddleware, adminOnly, async (req, res) => {
  try {
    const actions = await pool.query(`
      SELECT action, COUNT(*) as count
      FROM logs
      WHERE ts >= NOW() - INTERVAL '30 days'
      GROUP BY action
      ORDER BY count DESC
    `);

    res.json(actions.rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/analytics/recent-activities — Últimas actividades (admin only)
router.get('/analytics/recent-activities', authMiddleware, adminOnly, async (req, res) => {
  try {
    const limit = req.query.limit || 20;
    const activities = await pool.query(`
      SELECT l.id, l.user_id, u.name, u.username, l.action, l.detail, l.ts
      FROM logs l
      LEFT JOIN users u ON l.user_id = u.id
      ORDER BY l.ts DESC
      LIMIT $1
    `, [limit]);

    res.json(activities.rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/analytics/user-activity/:userId — Actividad de un usuario específico (admin only)
router.get('/analytics/user-activity/:userId', authMiddleware, adminOnly, async (req, res) => {
  try {
    const limit = req.query.limit || 50;
    const activities = await pool.query(`
      SELECT id, action, detail, ts
      FROM logs
      WHERE user_id = $1
      ORDER BY ts DESC
      LIMIT $2
    `, [req.params.userId, limit]);

    res.json(activities.rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ============================================================
// SETUP — Asegurar que items de menú existan
// ============================================================

// POST /api/setup/create-analytics-menu — Crear item de menú Analytics si no existe (admin only)
router.post('/setup/create-analytics-menu', authMiddleware, adminOnly, async (req, res) => {
  try {
    // Verificar si Analytics ya existe
    const check = await pool.query(`SELECT id FROM menu_items WHERE label = 'Analytics'`);
    if (check.rows.length > 0) {
      return res.json({ ok: true, message: 'Analytics menu item ya existe' });
    }

    // Crear el item de menú Analytics
    const menuRes = await pool.query(`
      INSERT INTO menu_items (label, icon, path, parent_id, order_index, is_active, created_by)
      VALUES ('Analytics', 'chart', 'pages/admin-analytics.html', NULL, 6, true, 1)
      RETURNING id
    `);

    const menuId = menuRes.rows[0].id;

    // Dar acceso al admin (usuario ID 1)
    await pool.query(`
      INSERT INTO menu_user_access (menu_item_id, user_id)
      VALUES ($1, 1)
      ON CONFLICT DO NOTHING
    `, [menuId]);

    await pool.query(`INSERT INTO logs (user_id, action, detail) VALUES ($1,$2,$3)`,
      [req.user.id, 'CREATE_MENU', 'Agregó item de menú: Analytics']);

    res.json({ ok: true, message: 'Analytics menu item creado exitosamente' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
