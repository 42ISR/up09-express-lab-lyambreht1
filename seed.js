const bcrypt = require('bcrypt');
const db = require('./db');

// Очищаем таблицы (в правильном порядке из-за FK)
db.exec('DELETE FROM reviews');
db.exec('DELETE FROM books');
db.exec('DELETE FROM users');
db.exec("DELETE FROM sqlite_sequence WHERE name IN ('reviews', 'books', 'users')");

// Хэшируем пароль
const passwordHash = bcrypt.hashSync('qwerty123', 10);

// Создаём пользователей
const insertUser = db.prepare(
  'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)'
);

const adminResult = insertUser.run(
  'admin',
  'admin@library.com',
  passwordHash,
  'admin'
);
const adminId = adminResult.lastInsertRowid;

const userResult = insertUser.run(
  'user',
  'user@library.com',
  passwordHash,
  'user'
);
const userId = userResult.lastInsertRowid;

// Создаём книги
const insertBook = db.prepare(
  'INSERT INTO books (title, author, year, genre, description, user_id) VALUES (?, ?, ?, ?, ?, ?)'
);

const books = [
  {
    title: 'Мастер и Маргарита',
    author: 'Михаил Булгаков',
    year: 1967,
    genre: 'Роман',
    description: 'Мистический роман о добре и зле, любви и трусости.',
  },
  {
    title: 'Преступление и наказание',
    author: 'Фёдор Достоевский',
    year: 1866,
    genre: 'Роман',
    description: 'История бывшего студента Раскольникова и его внутренней борьбы.',
  },
  {
    title: '1984',
    author: 'Джордж Оруэлл',
    year: 1949,
    genre: 'Антиутопия',
    description: 'Классическая антиутопия о тоталитарном обществе.',
  },
  {
    title: 'Гарри Поттер и философский камень',
    author: 'Дж. К. Роулинг',
    year: 1997,
    genre: 'Фэнтези',
    description: 'Первая книга о юном волшебнике Гарри Поттере.',
  },
  {
    title: 'Дюна',
    author: 'Фрэнк Герберт',
    year: 1965,
    genre: 'Фантастика',
    description: 'Эпическая сага о планете Арракис и борьбе за пряность.',
  },
];

const bookIds = books.map((book) => {
  const result = insertBook.run(
    book.title,
    book.author,
    book.year,
    book.genre,
    book.description,
    adminId
  );
  return result.lastInsertRowid;
});

// Создаём отзывы
const insertReview = db.prepare(
  'INSERT INTO reviews (book_id, user_id, rating, comment) VALUES (?, ?, ?, ?)'
);

const reviews = [
  { bookIndex: 0, userId: userId, rating: 5, comment: 'Шедевр на все времена!' },
  { bookIndex: 0, userId: adminId, rating: 5, comment: 'Перечитываю каждый год.' },
  { bookIndex: 1, userId: userId, rating: 4, comment: 'Тяжёлая, но глубокая книга.' },
  { bookIndex: 2, userId: userId, rating: 5, comment: 'Актуально и сегодня.' },
  { bookIndex: 3, userId: adminId, rating: 5, comment: 'Волшебная атмосфера детства.' },
];

reviews.forEach((r) => {
  insertReview.run(bookIds[r.bookIndex], r.userId, r.rating, r.comment);
});

console.log('✅ База данных успешно заполнена:');
console.log('   - Пользователей: 2 (admin, user)');
console.log(`   - Книг: ${books.length}`);
console.log(`   - Отзывов: ${reviews.length}`);
console.log('');
console.log('🔑 Креды для входа:');
console.log('   admin:qwerty123');
console.log('   user:qwerty123');