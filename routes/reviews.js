const express = require('express');
const db = require('../db');
const { auth } = require('../middleware/auth');

const router = express.Router({ mergeParams: true });

// POST /api/books/:id/reviews — добавить отзыв
router.post('/', auth, (req, res) => {
  const { id: bookId } = req.params;
  const { rating, comment } = req.body;

  const book = db.prepare('SELECT id FROM books WHERE id = ?').get(bookId);
  if (!book) {
    return res.status(404).json({ message: 'Книга не найдена' });
  }

  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ message: 'Рейтинг должен быть от 1 до 5' });
  }

  const result = db
    .prepare(
      'INSERT INTO reviews (book_id, user_id, rating, comment) VALUES (?, ?, ?, ?)'
    )
    .run(bookId, req.user.id, rating, comment || null);

  const review = db
    .prepare(
      `
      SELECT 
        reviews.id,
        reviews.book_id,
        reviews.user_id,
        reviews.rating,
        reviews.comment,
        reviews.createdAt,
        users.username AS author
      FROM reviews
      JOIN users ON reviews.user_id = users.id
      WHERE reviews.id = ?
    `
    )
    .get(result.lastInsertRowid);

  res.status(201).json({ message: 'Отзыв добавлен', review });
});

// GET /api/books/:id/reviews — все отзывы книги
router.get('/', (req, res) => {
  const { id: bookId } = req.params;

  const book = db.prepare('SELECT id FROM books WHERE id = ?').get(bookId);
  if (!book) {
    return res.status(404).json({ message: 'Книга не найдена' });
  }

  const reviews = db
    .prepare(
      `
      SELECT 
        reviews.id,
        reviews.rating,
        reviews.comment,
        reviews.createdAt,
        users.username AS author
      FROM reviews
      JOIN users ON reviews.user_id = users.id
      WHERE reviews.book_id = ?
      ORDER BY reviews.id DESC
    `
    )
    .all(bookId);

  res.json({ count: reviews.length, reviews });
});

// DELETE /api/reviews/:id — удалить отзыв
router.delete('/:id', auth, (req, res) => {
  const { id } = req.params;

  const review = db.prepare('SELECT * FROM reviews WHERE id = ?').get(id);

  if (!review) {
    return res.status(404).json({ message: 'Отзыв не найден' });
  }

  const isOwner = review.user_id === req.user.id;
  const isAdmin = req.user.role === 'admin';

  if (!isOwner && !isAdmin) {
    return res.status(403).json({ message: 'Нет прав на удаление этого отзыва' });
  }

  db.prepare('DELETE FROM reviews WHERE id = ?').run(id);

  res.json({ message: 'Отзыв удалён' });
});

module.exports = router;