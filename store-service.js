const fs = require('fs');
const path = require('path');

let items = [];
let categories = [];

function initialize() {
    return new Promise((resolve, reject) => {
        const itemsFilePath = path.join(__dirname, 'data', 'items.json');
        const categoriesFilePath = path.join(__dirname, 'data', 'categories.json');

        fs.readFile(itemsFilePath, 'utf8', (err, data) => {
            if (err) {
                reject('unable to read items file');
            } else {
                items = JSON.parse(data);
                fs.readFile(categoriesFilePath, 'utf8', (err, data) => {
                    if (err) {
                        reject('unable to read categories file');
                    } else {
                        categories = JSON.parse(data);
                        resolve();
                    }
                });
            }
        });
    });
}

/*function addItem(itemData) {
    return new Promise((resolve, reject) => {
        itemData.id = items.length + 1;
        itemData.published = itemData.published ? true : false;
        items.push(itemData);
        resolve(itemData);
    });
}*/

function addItem(itemData) {
    return new Promise((resolve, reject) => {
        if (itemData.published === undefined) {
            itemData.published = false;
        } else {
            itemData.published = true;
        }

        itemData.id = items.length + 1; // Setting the id
        items.push(itemData); // Adding the item to the array
        resolve(itemData);
    });
}


function getAllItems() {
    return new Promise((resolve, reject) => {
        if (items.length === 0) {
            reject('no results returned');
        } else {
            resolve(items);
        }
    });
}

function getPublishedItems() {
    return new Promise((resolve, reject) => {
        const publishedItems = items.filter(item => item.published);
        if (publishedItems.length === 0) {
            reject('no results returned');
        } else {
            resolve(publishedItems);
        }
    });
}

function getCategories() {
    return new Promise((resolve, reject) => {
        if (categories.length === 0) {
            reject('no results returned');
        } else {
            resolve(categories);
        }
    });
}

function getItemsByCategory(category) {
    return new Promise((resolve, reject) => {
        const filteredItems = items.filter(item => item.category == category);
        if (filteredItems.length > 0) {
            resolve(filteredItems);
        } else {
            reject("no results returned");
        }
    });
}

function getItemsByMinDate(minDateStr) {
    return new Promise((resolve, reject) => {
        const filteredItems = items.filter(item => new Date(item.postDate) >= new Date(minDateStr));
        if (filteredItems.length > 0) {
            resolve(filteredItems);
        } else {
            reject("no results returned");
        }
    });
}

function getItemById(id) {
    return new Promise((resolve, reject) => {
        const item = items.find(item => item.id == id);
        if (item) {
            resolve(item);
        } else {
            reject("no result returned");
        }
    });
}

module.exports = { initialize, getAllItems, getPublishedItems, getCategories, addItem, getItemsByCategory, getItemsByMinDate, getItemById };
