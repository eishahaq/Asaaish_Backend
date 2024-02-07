const Product = require('../Models/Product');
const Inventory = require('../Models/Inventory');
const createError = require('http-errors');
const jwt = require('jsonwebtoken');
const User = require('../Models/User')
const mongoose = require('mongoose');



const ProductController = {

    async addProduct(req, res, next) {
        try {
            const token = req.headers.authorization.split(' ')[1]; // Assuming the token is sent in the Authorization header
            const payload = jwt.decode(token); // Decode JWT to get the payload

            // Fetch the user using payload.aud
            const user = await User.findById(payload.aud);
            if (!user) {
                throw createError.NotFound('User not found');
            }

            // Check if the user's role is 'Vendor'
            if (user.role !== 'Vendor') {
                throw createError.Unauthorized('Unauthorized or invalid role');
            }

            const { name, description, price, color, category, collectionName, discount, size, imageUrl } = req.body;

            // Create and save the product
            const newProduct = new Product({
                productID: new mongoose.Types.ObjectId(),
                name,
                description,
                price,
                color,
                category,
                collectionName,
                discount,
                size,
                imageUrl
            });

            const savedProduct = await newProduct.save();
            console.log('Product created:', savedProduct);

            // Assuming initial inventory details are also provided in the request
            const { quantityAvailable, restockLevel } = req.body;

            // Create and save the inventory for the product
            const newInventory = new Inventory({
                inventoryID: new mongoose.Types.ObjectId(),
                productID: savedProduct._id, // Link to the product just created
                quantityAvailable,
                restockLevel,
                lastRestockDate: new Date() // Set to current date
            });

            const savedInventory = await newInventory.save();
            console.log('Inventory created for product:', savedInventory);

            res.status(201).send({ product: savedProduct, inventory: savedInventory });
        } catch (error) {
            console.error('Add product error:', error);
            next(error);
        }
    },

    async importProducts(req, res, next) {
        try {
            if (!req.file) {
                return res.status(400).send({ message: 'No file uploaded' });
            }            
            const file = req.file.path;
            console.log(file) // Path to the uploaded CSV file
            const columnMapping = req.body.mapping; // Mapping from frontend
            const filePath = req.file ? req.file.path : null;
            if (!filePath) {
                return res.status(400).send({ message: 'No file uploaded' });
            }
            // Parse the CSV file
            const content = fs.readFileSync(file, 'utf8');
            const parsedData = Papa.parse(content, { header: true }).data;

            // Process each row based on the mapping
            const products = parsedData.map(row => {
                let productData = {};
                for (const [fileColumn, schemaField] of Object.entries(columnMapping)) {
                    productData[schemaField] = row[fileColumn];
                }
                return new Product(productData);
            });

            // Save all products to the database
            await Product.insertMany(products);

            res.status(201).send({ message: 'Products imported successfully' });
        } catch (error) {
            console.error('Import products error:', error);
            next(error);
        }
    }
};

module.exports = ProductController;
