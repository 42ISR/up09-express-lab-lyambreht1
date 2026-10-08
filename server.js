const express = require('express');
const cors = require('cors');

const authRouter = require('./routes/auth');
const booksRouter = require('./routes/books');
const reviewsRouter = require('./routes/reviews');
const adminRouter = require('./routes/admin');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'Book API is running' });
});

app.use('/api/auth', authRouter);
app.use('/api/books', booksRouter);
app.use('/api/books/:id/reviews', reviewsRouter);
app.use('/api/reviews', reviewsRouter);
app.use('/api/admin', adminRouter);

app.listen(PORT, () => {
  console.log(`Сервер запущен на http://localhost:${PORT}`);
});