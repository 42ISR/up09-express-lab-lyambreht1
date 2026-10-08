const express = require('express');
const db = require('../db');
const { auth } = require('../middleware/auth');
const checkRole = require('../middleware/checkRole');

const router = express.Router();

// GET /api/admin/users — получить всех пользователей (только админ)
router.get('/users', auth, checkRole('admin'), (req, res) => {
  const users = db
    .prepare(
      `
      SELECT id, username, email, role, createdAt
      FROM users
      ORDER BY id ASC
    `
    )
    .all();

  res.json({ count: users.length, users });
});

// DELETE /api/admin/users/:id — удалить пользователя (только админ)
router.delete('/users/:id', auth, checkRole('admin'), (req, res) => {
  const { id } = req.params;

  if (Number(id) === req.user.id) {
    return res.status(400).json({ message: 'Нельзя удалить самого себя' });
  }

  const user = db.prepare('SELECT id FROM users WHERE id = ?').get(id);
  if (!user) {
    return res.status(404).json({ message: 'Пользователь не найден' });
  }

  db.prepare('DELETE FROM users WHERE id = ?').run(id);

  res.json({ message: 'Пользователь удалён' });
});

module.exports = router;