const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { auth, JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

// POST /api/auth/register
router.post('/register', (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ message: 'Все поля обязательны' });
  }

  if (password.length < 6) {
    return res.status(400).json({ message: 'Пароль должен быть минимум 6 символов' });
  }

  const existing = db
    .prepare('SELECT id FROM users WHERE email = ?')
    .get(email);

  if (existing) {
    return res.status(409).json({ message: 'Email уже занят' });
  }

  const passwordHash = bcrypt.hashSync(password, 10);

  const result = db
    .prepare(
      'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)'
    )
    .run(username, email, passwordHash, 'user');

  const token = jwt.sign(
    { id: result.lastInsertRowid },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.status(201).json({
    message: 'Регистрация успешна',
    token,
    user: {
      id: result.lastInsertRowid,
      username,
      email,
      role: 'user',
    },
  });
});

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email и пароль обязательны' });
  }

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

  if (!user) {
    return res.status(401).json({ message: 'Неверный email или пароль' });
  }

  const validPassword = bcrypt.compareSync(password, user.password);

  if (!validPassword) {
    return res.status(401).json({ message: 'Неверный email или пароль' });
  }

  const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '7d' });

  res.json({
    message: 'Вход выполнен',
    token,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    },
  });
});

// GET /api/auth/profile
router.get('/profile', auth, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;