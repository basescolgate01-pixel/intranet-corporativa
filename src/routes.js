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
    const result = await pool.query(`
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

module.exports = router;
