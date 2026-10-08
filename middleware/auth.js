const jwt = require('jsonwebtoken');
const db = require('../db');

const JWT_SECRET = 'super-secret-key-change-me';

function auth(req, res, next) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Токен не предоставлен' });
  }

  const token = header.slice(7);

  try {
    const payload = jwt.verify(token, JWT_SECRET);

    const user = db
      .prepare('SELECT id, username, email, role FROM users WHERE id = ?')
      .get(payload.id);

    if (!user) {
      return res.status(401).json({ message: 'Пользователь не найден' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Недействительный токен' });
  }
}

module.exports = { auth, JWT_SECRET };