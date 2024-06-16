/*********************************************************************************

WEB322 – Assignment 02

I declare that this assignment is my own work in accordance with Seneca Academic Policy.
No part of this assignment has been copied manually or electronically from any other source (including 3rd party web sites) or distributed to other students.

Name: Param Singh Virdi

Student ID: 164073215

Date: 10/09/2024

Vercel Web App URL: 

GitHub Repository URL: 

********************************************************************************/

const express = require('express'); // "require" the Express module
const app = express(); // obtain the "app" object
const HTTP_PORT = process.env.PORT || 8080; // assign a port
const path = require('path');
const storeService = require('./store-service');

// Serve static files from the "public" directory
app.use(express.static(__dirname + '/public'));

// Route to serve about.html on /about URL
app.get('/about', (req, res) => {
    res.sendFile(path.join(__dirname, 'views/about.html'));
});

// Redirect root to /about
app.get('/', (req, res) => {
    res.redirect('/about');
});

// Route to return all items
app.get('/items', (req, res) => {
    storeService.getAllItems()
        .then((data) => res.json(data))
        .catch((err) => res.status(404).json({ message: err }));
});

// Route to return all published items
app.get('/shop', (req, res) => {
    storeService.getPublishedItems()
        .then((data) => res.json(data))
        .catch((err) => res.status(404).json({ message: err }));
});

// Route to return all categories
app.get('/categories', (req, res) => {
    storeService.getCategories()
        .then((data) => res.json(data))
        .catch((err) => res.status(404).json({ message: err }));
});

// Handle 404 - Page Not Found
app.use((req, res) => {
    res.status(404).send('Page Not Found');
});

// Initialize store service and start the server
storeService.initialize()
    .then(() => {
        app.listen(HTTP_PORT, () => console.log(`Express http server listening on port ${HTTP_PORT}`));
    })
    .catch((err) => {
        console.error(`Unable to start server: ${err}`);
    });
