const express = require('express');
const jwt = require('jsonwebtoken');
const session = require('express-session');
const authUsers = require('./router/auth_users'); // Changed this line
const genl_routes = require('./router/general').general;

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Add this line
app.use(session({
    secret: "fingerprint_customer",
    resave: true,
    saveUninitialized: true
}));

// Mount unauthenticated routes (register and login)
app.use("/customer", authUsers.unauthenticated); // Changed this line

// Authentication middleware
const auth = (req, res, next) => {
    if (req.session.authorization) {
        const token = req.session.authorization.accessToken;
        jwt.verify(token, "access", (err, user) => {
            if (!err) {
                req.user = user;
                next();
            } else {
                return res.status(403).json({ message: "User not authenticated" });
            }
        });
    } else {
        return res.status(403).json({ message: "User not logged in" });
    }
};

// Mount authenticated routes
app.use("/customer/auth", auth, authUsers.authenticated); // Changed this line

// General routes
app.use("/", genl_routes);

const PORT = 5000;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));