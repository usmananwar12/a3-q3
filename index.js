const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 8000;

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Load books from JSON file
let books = require('./books.json');

// Serve CSS file
app.use(express.static('public'));

// Home page
app.get('/', (req, res) => {
  res.send(`<h2>Welcome to Book Management</h2>
  <p><a href="/books">View All Books</a></p>
  <p><a href="/add-book-form">Add New Book</a></p>`);
});

// GET all books (HTML)
app.get('/books', (req, res) => {
  let bookList = books.map(book => `
    <tr>
      <td>${book.id}</td>
      <td>${book.title}</td>
      <td>${book.author}</td>
      <td>${book.year}</td>
      <td>
        <a href="/books/${book.id}">View</a> |
        <a href="/update-book-form/${book.id}">Edit</a> |
        <a href="/delete-book-form/${book.id}">Delete</a>
      </td>
    </tr>
  `).join('');

  res.send(`
    <link rel="stylesheet" href="/style.css">
    <h2>All Books</h2>
    <table border="1">
      <tr><th>ID</th><th>Title</th><th>Author</th><th>Year</th><th>Actions</th></tr>
      ${bookList}
    </table>
    <p><a href="/">Back to Home</a></p>
  `);
});

// GET book by ID (HTML)
app.get('/books/:id', (req, res) => {
  const id = Number(req.params.id);
  const book = books.find(b => b.id === id);
  if (!book) {
    return res.status(404).send(`<h3>Book not found</h3><p><a href="/books">Back</a></p>`);
  }

  res.send(`
    <link rel="stylesheet" href="/style.css">
    <h2>Book Details</h2>
    <p><b>ID:</b> ${book.id}</p>
    <p><b>Title:</b> ${book.title}</p>
    <p><b>Author:</b> ${book.author}</p>
    <p><b>Year:</b> ${book.year}</p>
    <p><a href="/books">Back to All Books</a></p>
  `);
});

// GET book by TITLE (HTML)
app.get('/search/title/:title', (req, res) => {
  const title = req.params.title.toLowerCase();
  const book = books.find(b => b.title.toLowerCase() === title);
  if (!book) {
    return res.status(404).send(`<h3>Book not found</h3><p><a href="/books">Back</a></p>`);
  }

  res.send(`
    <link rel="stylesheet" href="/style.css">
    <h2>Book Details</h2>
    <p><b>ID:</b> ${book.id}</p>
    <p><b>Title:</b> ${book.title}</p>
    <p><b>Author:</b> ${book.author}</p>
    <p><b>Year:</b> ${book.year}</p>
    <p><a href="/books">Back to All Books</a></p>
  `);
});

// HTML form to add book
app.get('/add-book-form', (req, res) => {
  res.send(`
    <link rel="stylesheet" href="/style.css">
    <h2>Add New Book</h2>
    <form action="/books" method="POST">
      <p>Title: <input name="title" required></p>
      <p>Author: <input name="author" required></p>
      <p>Year: <input name="year" type="number" required></p>
      <button type="submit">Add Book</button>
    </form>
    <p><a href="/">Back to Home</a></p>
  `);
});

// POST add book
app.post('/books', (req, res) => {
  const { title, author, year } = req.body;

  // Validation
  if (!title || !author || !year || isNaN(year)) {
    return res.status(400).send("Invalid data");
  }

  const newBook = {
    id: books.length ? books[books.length - 1].id + 1 : 1,
    title,
    author,
    year: Number(year)
  };

  books.push(newBook);
  fs.writeFileSync(path.join(__dirname, 'books.json'), JSON.stringify(books, null, 2));
  res.redirect('/books');
});

// HTML form to update book
app.get('/update-book-form/:id', (req, res) => {
  const id = Number(req.params.id);
  const book = books.find(b => b.id === id);
  if (!book) {
    return res.status(404).send(`<h3>Book not found</h3><p><a href="/books">Back</a></p>`);
  }

  res.send(`
    <link rel="stylesheet" href="/style.css">
    <h2>Update Book</h2>
    <form action="/books/${id}?_method=PUT" method="POST">
      <p>Title: <input name="title" value="${book.title}" required></p>
      <p>Author: <input name="author" value="${book.author}" required></p>
      <p>Year: <input name="year" type="number" value="${book.year}" required></p>
      <button type="submit">Update Book</button>
    </form>
    <p><a href="/books">Back to All Books</a></p>
  `);
});

// HTML form to delete book
app.get('/delete-book-form/:id', (req, res) => {
  const id = Number(req.params.id);
  const book = books.find(b => b.id === id);
  if (!book) {
    return res.status(404).send(`<h3>Book not found</h3><p><a href="/books">Back</a></p>`);
  }

  res.send(`
    <link rel="stylesheet" href="/style.css">
    <h2>Delete Book</h2>
    <p>Are you sure you want to delete <b>${book.title}</b>?</p>
    <form action="/books/${id}?_method=DELETE" method="POST">
      <button type="submit">Yes, Delete</button>
    </form>
    <p><a href="/books">Cancel</a></p>
  `);
});

// Middleware to simulate PUT and DELETE using POST (_method)
app.use((req, res, next) => {
  if (req.query._method) {
    req.method = req.query._method.toUpperCase();
  }
  next();
});

// PUT update book
app.put('/books/:id', (req, res) => {
  const id = Number(req.params.id);
  const { title, author, year } = req.body;
  const bookIndex = books.findIndex(b => b.id === id);

  if (bookIndex === -1) {
    return res.status(404).send("Book not found");
  }

  // Validation
  if (!title || !author || !year || isNaN(year)) {
    return res.status(400).send("Invalid data");
  }

  books[bookIndex] = { id, title, author, year: Number(year) };
  fs.writeFileSync(path.join(__dirname, 'books.json'), JSON.stringify(books, null, 2));
  res.redirect('/books');
});

// DELETE book
app.delete('/books/:id', (req, res) => {
  const id = Number(req.params.id);
  const bookIndex = books.findIndex(b => b.id === id);
  if (bookIndex === -1) {
    return res.status(404).send("Book not found");
  }

  books.splice(bookIndex, 1);
  fs.writeFileSync(path.join(__dirname, 'books.json'), JSON.stringify(books, null, 2));
  res.redirect('/books');
});

app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
