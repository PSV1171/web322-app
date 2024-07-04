/*********************************************************************************
*  WEB322 – Assignment 03
*  I declare that this assignment is my own work in accordance with Seneca  Academic Policy.  No part 
*  of this assignment has been copied manually or electronically from any other source 
*  (including 3rd party web sites) or distributed to other students.
* 
*  Name: Param Singh Virdi Student ID: 164073215 Date: 7/2/2024
*
*  Vercel Web App URL: https://web322-moxcb6nc2-nik1171s-projects.vercel.app
* 
*  GitHub Repository URL: https://github.com/PSV1171/web322-app.git
*
********************************************************************************/ 


const express = require('express'); // "require" the Express module
const app = express(); // obtain the "app" object
const HTTP_PORT = process.env.PORT || 8080; // assign a port
const path = require('path');
const storeService = require('./store-service');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');

cloudinary.config({
    cloud_name: 'dcetjtubd',
    api_key: '113458997972816',
    api_secret: 'oDn2BvkJ6z8tVF4eCHiSftCrd1k',
    secure: true
});

const upload = multer(); // No disk storage, using memory storage

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

// Route to serve about.html on /about URL
app.get('/about', (req, res) => {
    res.sendFile(path.join(__dirname, 'views/about.html'));
});

// Redirect root to /about
app.get('/', (req, res) => {
    res.redirect('/about');
});

/* Route to return all items
app.get('/items', (req, res) => {
    storeService.getAllItems()
        .then((data) => res.json(data))
        .catch((err) => res.status(404).json({ message: err }));
});*/

// Route to include optional filters with all items
app.get('/items', (req, res) => {
    if (req.query.category) {
        storeService.getItemsByCategory(req.query.category)
            .then((data) => res.json(data))
            .catch((err) => res.status(404).json({ message: err }));
    } else if (req.query.minDate) {
        storeService.getItemsByMinDate(req.query.minDate)
            .then((data) => res.json(data))
            .catch((err) => res.status(404).json({ message: err }));
    } else {
        storeService.getAllItems()
            .then((data) => res.json(data))
            .catch((err) => res.status(404).json({ message: err }));
    }
});

// Route to add items
app.get('/items/add', (req, res) => {
    res.sendFile(path.join(__dirname, '/views/addItem.html'));
});

// Route to get an item by ID
app.get('/item/:id', (req, res) => {
    storeService.getItemById(req.params.id)
        .then((data) => res.json(data))
        .catch((err) => res.status(404).json({ message: err }));
});


// POST Route to handle item addition
app.post('/items/add', upload.single('featureImage'), (req, res) => {
    if (req.file) {
        let streamUpload = (req) => {
            return new Promise((resolve, reject) => {
                let stream = cloudinary.uploader.upload_stream(
                    (error, result) => {
                        if (result) {
                            resolve(result);
                        } else {
                            reject(error);
                        }
                    }
                );

                streamifier.createReadStream(req.file.buffer).pipe(stream);
            });
        };

        async function upload(req) {
            let result = await streamUpload(req);
            return result;
        }

        upload(req).then((uploaded) => {
            processItem(uploaded.url);
        }).catch((err) => {
            console.error(err);
            processItem("");
        });
    } else {
        processItem("");
    }

    function processItem(imageUrl) {
        req.body.featureImage = imageUrl;

        storeService.addItem(req.body).then((newItem) => {
            res.redirect('/items');
        }).catch((err) => {
            res.send("There was an error adding the item.");
        });
    }
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
