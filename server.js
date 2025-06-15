const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const { type } = require('os');
require('dotenv').config();
const app = express();
const PORT = process.env.PORT || 3000;
// Google OAuth Client

const routes = require('./version1/routes');

const cors = require('cors');
app.use(cors());
// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, { })
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));

// User schema


// Middleware to parse JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, 'public')));



// Use routes
app.use('/', routes);



// Start the server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});