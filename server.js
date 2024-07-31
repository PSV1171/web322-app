/*********************************************************************************
*  WEB322 – Assignment 05
*  I declare that this assignment is my own work in accordance with Seneca Academic Policy.  No part 
*  of this assignment has been copied manually or electronically from any other source 
*  (including 3rd party web sites) or distributed to other students.
* 
*  Name: Param Singh Virdi Student ID: 164073215 Date: 7/30/2024
*
*  Vercel Web App URL: 
* 
*  GitHub Repository URL: 
*
********************************************************************************/ 

const express = require('express');
const app = express();
const HTTP_PORT = process.env.PORT || 8080;
const path = require('path');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');
const storeService = require('./store-service');
const exphbs = require('express-handlebars');

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
        },
        formatDate: function(dateObj) {
            let year = dateObj.getFullYear();
            let month = (dateObj.getMonth() + 1).toString();
            let day = dateObj.getDate().toString();
            return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
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

app.use(express.urlencoded({ extended: true }));

// Categories Routes
app.get('/categories/add', (req, res) => {
    res.render('addCategory');
});

app.post('/categories/add', (req, res) => {
    storeService.addCategory(req.body).then(() => {
        res.redirect('/categories');
    }).catch((err) => {
        res.status(500).send("Unable to Add Category");
    });
});

app.get('/categories/delete/:id', (req, res) => {
    storeService.deleteCategoryById(req.params.id).then(() => {
        res.redirect('/categories');
    }).catch((err) => {
        res.status(500).send("Unable to Remove Category / Category not found");
    });
});

// Items Deletion Routes
app.get('/items/delete/:id', (req, res) => {
    storeService.deleteItemById(req.params.id).then(() => {
        res.redirect('/items');
    }).catch((err) => {
        res.status(500).send("Unable to Remove Item / Item not found");
    });
});

// Route to render about instead of /about.html file
app.get('/about', (req, res) => {
    res.render('about');
});

// Redirect root to /shop
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
    storeService.getCategories().then((data) => {
        res.render('addItem', { categories: data });
    }).catch(() => {
        res.render('addItem', { categories: [] });
    });
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

// Route to get an item by ID
app.get('/item/:id', (req, res) => {
    storeService.getItemById(req.params.id)
        .then((data) => res.json(data))
        .catch((err) => res.status(404).json({ message: err }));
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

//Handle Vercel Deployment with Database URL
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

pool.connect((err, client, release) => {
  if (err) {
    return console.error('Error acquiring client', err.stack);
  }
  client.query('SELECT NOW()', (err, result) => {
    release();
    if (err) {
      return console.error('Error executing query', err.stack);
    }
    console.log(result.rows);
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
