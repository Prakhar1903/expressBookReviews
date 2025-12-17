const express = require('express');
const jwt = require('jsonwebtoken');
let books = require("./booksdb.js");

// Create separate routers for authenticated and unauthenticated routes
const router = express.Router();
const authRouter = express.Router();

let users = [];

const isValid = (username) => {
    return users.some(user => user.username === username);
};

const authenticatedUser = (username, password) => {
    return users.some(user => user.username === username && user.password === password);
};

// Register a new user (unauthenticated)
router.post("/register", (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
    }

    if (isValid(username)) {
        return res.status(400).json({ message: "Username already exists" });
    }

    users.push({ username, password });
    return res.status(200).json({ message: "User successfully registered. Now you can login" });
});

// User login (unauthenticated)
router.post("/login", (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
    }

    if (authenticatedUser(username, password)) {
        const accessToken = jwt.sign({ username: username }, 'access', { expiresIn: '1h' });
        req.session.authorization = { accessToken, username };
        return res.status(200).json({ 
            message: "User successfully logged in",
            token: accessToken
        });
    } else {
        return res.status(401).json({ message: "Invalid Login. Check username and password" });
    }
});

// Protected routes (require authentication)

// Add a book review
authRouter.put("/review/:isbn", (req, res) => {
    const { isbn } = req.params;
    const { review } = req.body;
    const { username } = req.session.authorization;

    if (!books[isbn]) {
        return res.status(404).json({ message: "Book not found" });
    }

    if (!books[isbn].reviews) {
        books[isbn].reviews = {};
    }

    books[isbn].reviews[username] = review;
    return res.status(200).json({ message: "Review added/updated successfully" });
});

// Get all books (protected)
authRouter.get('/books', (req, res) => {
    return res.status(200).json(books);
});

// Get current user's reviews
authRouter.get('/reviews', (req, res) => {
    const { username } = req.session.authorization;
    const userReviews = {};

    for (const [isbn, book] of Object.entries(books)) {
        if (book.reviews && book.reviews[username]) {
            userReviews[isbn] = {
                title: book.title,
                review: book.reviews[username]
            };
        }
    }

    return res.status(200).json(userReviews);
});
// Add this code to your auth_users.js file, inside the authRouter section

// Delete a book review
authRouter.delete("/review/:isbn", (req, res) => {
    const { isbn } = req.params;
    const { username } = req.session.authorization;

    if (!books[isbn]) {
        return res.status(404).json({ message: "Book not found" });
    }

    if (!books[isbn].reviews || !books[isbn].reviews[username]) {
        return res.status(404).json({ message: "No review found for this user and book" });
    }

    // Delete the review
    delete books[isbn].reviews[username];

    return res.status(200).json({ 
        message: "Review deleted successfully",
        isbn: isbn,
        username: username
    });
});

module.exports = {
    unauthenticated: router,  // For register and login
    authenticated: authRouter, // For protected routes
    isValid,
    users
};