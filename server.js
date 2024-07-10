/*********************************************************************************
*  WEB322 – Assignment 03
*  I declare that this assignment is my own work in accordance with Seneca Academic Policy.  No part 
*  of this assignment has been copied manually or electronically from any other source 
*  (including 3rd party web sites) or distributed to other students.
* 
*  Name: Param Singh Virdi Student ID: 164073215 Date: 7/9/2024
*
*  Vercel Web App URL: 
* 
*  GitHub Repository URL: 
*
********************************************************************************/ 

const express = require('express'); // "require" the Express module
const app = express(); // obtain the "app" object
const exphbs = require('express-handlebars');
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

// Set up express-handlebars
const hbs = exphbs.create({
    extname: '.hbs',
    defaultLayout: 'main',
    helpers: {
        navLink: function(url, options){
            return '<li class="nav-item">' + 
                '<a class="nav-link' + ((url === app.locals.activeRoute) ? ' active' : '') + '" href="' + url + '">' + options.fn(this) + '</a></li>';
        },
        equal: function (lvalue, rvalue, options) {
            if (arguments.length < 3)
                throw new Error("Handlebars Helper equal needs 2 parameters");
            if (lvalue != rvalue) {
                return options.inverse(this);
            } else {
                return options.fn(this);
            }
        }        
    }
});

app.engine('.hbs', hbs.engine);
app.set('view engine', '.hbs');
app.set('views', path.join(__dirname, 'views'));

// Middleware to manage active route
app.use(function(req, res, next){
    let route = req.path.substring(1);
    app.locals.activeRoute = "/" + (isNaN(route.split('/')[1]) ? route.replace(/\/(?!.*)/, "") : route.replace(/\/(.*)/, ""));
    app.locals.viewingCategory = req.query.category;
    next();
});

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

// Route to render about instead of /about.html file
app.get('/about', (req, res) => {
    res.render('about');
});

// Redirect root to /about
app.get('/', (req, res) => {
    res.redirect('/shop');
});

// Items route
app.get('/items', (req, res) => {
    if (req.query.category) {
        storeService.getItemsByCategory(req.query.category).then((data) => {
            res.render('items', { items: data });
        }).catch(() => {
            res.render('items', { message: 'no results' });
        });
    } else {
        storeService.getAllItems().then((data) => {
            res.render('items', { items: data });
        }).catch(() => {
            res.render('items', { message: 'no results' });
        });
    }
});

// Route to add items
app.get('/items/add', (req, res) => {
    res.render('addItem');
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
app.get("/shop", async (req, res) => {
    let viewData = {};

    try {
        let items = [];

        if (req.query.category) {
            items = await storeService.getPublishedItemsByCategory(req.query.category);
        } else {
            items = await storeService.getPublishedItems();
        }

        items.sort((a, b) => new Date(b.postDate) - new Date(a.postDate));

        let post = items[0];

        viewData.items = items;
        viewData.post = post;
    } catch (err) {
        viewData.message = "no results";
    }

    try {
        let categories = await storeService.getCategories();
        viewData.categories = categories;
    } catch (err) {
        viewData.categoriesMessage = "no results";
    }

    res.render("shop", { data: viewData });
});

// Re-route for published items
app.get('/shop/:id', async (req, res) => {
    let viewData = {};

    try {
        let items = [];

        if (req.query.category) {
            items = await storeService.getPublishedItemsByCategory(req.query.category);
        } else {
            items = await storeService.getPublishedItems();
        }

        items.sort((a, b) => new Date(b.postDate) - new Date(a.postDate));
        viewData.items = items;
    } catch (err) {
        viewData.message = "no results";
    }

    try {
        viewData.post = await storeService.getItemById(req.params.id);
    } catch (err) {
        viewData.message = "no results";
    }

    try {
        let categories = await storeService.getCategories();
        viewData.categories = categories;
    } catch (err) {
        viewData.categoriesMessage = "no results";
    }

    res.render("shop", { data: viewData });
});

// Categories route
app.get('/categories', (req, res) => {
    storeService.getCategories().then((data) => {
        res.render('categories', { categories: data });
    }).catch(() => {
        res.render('categories', { message: 'no results' });
    });
});

// Handle 404 - Page Not Found
app.use((req, res) => {
    res.status(404).render('404');
});

// Initialize store service and start the server
storeService.initialize()
    .then(() => {
        app.listen(HTTP_PORT, () => console.log(`Express http server listening on port ${HTTP_PORT}`));
    })
    .catch((err) => {
        console.error(`Unable to start server: ${err}`);
    });
