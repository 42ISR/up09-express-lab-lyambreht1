const express = require('express');
const db = require('../db');
const { auth } = require('../middleware/auth');

const router = express.Router();

// GET /api/books — список всех книг с фильтрацией
router.get('/', (req, res) => {
  const { genre, author } = req.query;

  let sql = `
    SELECT 
      books.id,
      books.title,
      books.author,
      books.year,
      books.genre,
      books.description,
      books.user_id,
      users.username AS added_by,
      books.createdAt
    FROM books
    JOIN users ON books.user_id = users.id
  `;

  const conditions = [];
  const params = [];

  if (genre) {
    conditions.push('books.genre = ?');
    params.push(genre);
  }

  if (author) {
    conditions.push('books.author LIKE ?');
    params.push(`%${author}%`);
  }

  if (conditions.length > 0) {
    sql += ' WHERE ' + conditions.join(' AND ');
  }

  sql += ' ORDER BY books.id DESC';

  const books = db.prepare(sql).all(...params);

  res.json({ count: books.length, books });
});

// GET /api/books/:id — одна книга с отзывами
router.get('/:id', (req, res) => {
  const { id } = req.params;

  const book = db
    .prepare(
      `
      SELECT 
        books.id,
        books.title,
        books.author,
        books.year,
        books.genre,
        books.description,
        books.user_id,
        users.username AS added_by,
        books.createdAt
      FROM books
      JOIN users ON books.user_id = users.id
      WHERE books.id = ?
    `
    )
    .get(id);

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
    .all(id);

  res.json({ ...book, reviews });
});

// POST /api/books — добавить книгу (только авторизованные)
router.post('/', auth, (req, res) => {
  const { title, author, year, genre, description } = req.body;

  if (!title || !author) {
    return res.status(400).json({ message: 'Поля title и author обязательны' });
  }

  const result = db
    .prepare(
      'INSERT INTO books (title, author, year, genre, description, user_id) VALUES (?, ?, ?, ?, ?, ?)'
    )
    .run(title, author, year || null, genre || null, description || null, req.user.id);

  const book = db
    .prepare('SELECT * FROM books WHERE id = ?')
    .get(result.lastInsertRowid);

  res.status(201).json({ message: 'Книга добавлена', book });
});

// PUT /api/books/:id — обновить книгу (автор или админ)
router.put('/:id', auth, (req, res) => {
  const { id } = req.params;

  const book = db.prepare('SELECT * FROM books WHERE id = ?').get(id);

  if (!book) {
    return res.status(404).json({ message: 'Книга не найдена' });
  }

  const isOwner = book.user_id === req.user.id;
  const isAdmin = req.user.role === 'admin';

  if (!isOwner && !isAdmin) {
    return res.status(403).json({ message: 'Нет прав на редактирование этой книги' });
  }

  const { title, author, year, genre, description } = req.body;

  db.prepare(
    `
    UPDATE books
    SET title = ?, author = ?, year = ?, genre = ?, description = ?
    WHERE id = ?
  `
  ).run(
    title ?? book.title,
    author ?? book.author,
    year ?? book.year,
    genre ?? book.genre,
    description ?? book.description,
    id
  );

  const updated = db.prepare('SELECT * FROM books WHERE id = ?').get(id);

  res.json({ message: 'Книга обновлена', book: updated });
});

// DELETE /api/books/:id — удалить книгу (автор или админ)
router.delete('/:id', auth, (req, res) => {
  const { id } = req.params;

  const book = db.prepare('SELECT * FROM books WHERE id = ?').get(id);

  if (!book) {
    return res.status(404).json({ message: 'Книга не найдена' });
  }

  const isOwner = book.user_id === req.user.id;
  const isAdmin = req.user.role === 'admin';

  if (!isOwner && !isAdmin) {
    return res.status(403).json({ message: 'Нет прав на удаление этой книги' });
  }

  db.prepare('DELETE FROM books WHERE id = ?').run(id);

  res.json({ message: 'Книга удалена' });
});

module.exports = router;