
const Product = require('../Models/Product'); 
const Category = require('../Models/Category'); // Corrected require statement
const Tag = require('../Models/Tag'); // Add Tag model
const User = require('../Models/User');
const createError = require('http-errors');
const Inventory = require('../Models/Inventory'); // Corrected require statement
const Collection = require('../Models/Collection'); // Corrected require statement
const ObjectIdGenerator = require('../Helpers/objectidGenerator'); // Adjust the path as needed

const Papa = require('papaparse');
const fs = require('fs');
const xlsx = require('xlsx');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const mongoose = require('mongoose');



const ProductController = {
    async createProduct(req, res, next) {
        try {
            const userId = req.payload.aud; // Assuming your authentication middleware sets this
            console.log(`User ID: ${userId}`);
    
            const user = await User.findById(userId);
            if (!user) {
                console.log('User not found');
                return next(createError.NotFound("User not found"));
            }
    
            if (!['Admin', 'Vendor'].includes(user.role)) {
                console.log(`Forbidden: User role is ${user.role}`);
                return next(createError.Forbidden("Only admins and vendors can create products"));
            }
    
            const { brandId, name, description, category, tags, price, images, offers, collection, productCode } = req.body;
            console.log('Request Body:', req.body);
    
            // Validate the category
            const categoryExists = await Category.findById(category);
            if (!categoryExists) {
                console.log(`Category with ID ${category} does not exist`);
                return next(createError.BadRequest(`Category with ID ${category} does not exist`));
            }
    
            // Validate tags
            for (let tagId of tags) {
                const tagExists = await Tag.findById(tagId);
                if (!tagExists) {
                    console.log(`Tag with ID ${tagId} does not exist`);
                    return next(createError.BadRequest(`Tag with ID ${tagId} does not exist`));
                }
            }
    
            // Check if the productCode is unique
            const existingProduct = await Product.findOne({ productCode });
            if (existingProduct) {
                console.log(`Product code ${productCode} already exists. Returning existing product ID.`);
                return res.status(200).json({ _id: existingProduct._id });
            }
    
            const product = new Product({
                brandId,
                name,
                description,
                category, // Updated to singular category
                tags, // Added tags
                price,
                images,
                offers,
                productCode // Added productCode
            });
    
            await product.save();
            console.log('Product saved:', product);
    
            // If a collection ID is provided, add the product to the collection
            if (collection) {
                const collectionDoc = await Collection.findById(collection);
                if (!collectionDoc) {
                    console.log(`Collection with ID ${collection} does not exist`);
                    return next(createError.BadRequest(`Collection with ID ${collection} does not exist`));
                }
                collectionDoc.products.push(product._id);
                await collectionDoc.save();
                console.log('Product added to collection:', collectionDoc);
            }
    
            res.status(201).json(product);
        } catch (error) {
            console.error('Error:', error.message);
            next(createError.InternalServerError(error.message));
        }
    },

     // Updated to include 'tags' in populate methods
     async getAllProducts(req, res, next) {
        try {
            const products = await Product.find().populate('brandId').populate('category').populate('tags');
            res.status(200).json(products);
        } catch (error) {
            next(createError.InternalServerError(error.message));
        }
    },

    // Updated to include 'tags' in populate methods
    async getProductById(req, res, next) {
        try {
            const product = await Product.findById(req.params.id).populate('brandId').populate('category').populate('tags');
            if (!product) return next(createError.NotFound('Product not found'));
            res.status(200).json(product);
        } catch (error) {
            next(createError.InternalServerError(error.message));
        }
    },

    // Updated to include 'tags' in populate methods
    async getProductsByBrand(req, res, next) {
        try {
            const { brandId } = req.params;
            const products = await Product.find({ brandId }).populate('brandId').populate('category').populate('tags');
            if (!products.length) return res.status(200).json([]);
            res.status(200).json(products);
        } catch (error) {
            next(createError.InternalServerError(error.message));
        }
    },

    // Updated to handle tag addition/removal and populate 'tags'
    async updateProduct(req, res, next) {
        try {
            const userId = req.payload.aud;
            const user = await User.findById(userId);

            if (user.role === 'Customer') {
                return next(createError.Forbidden("Only admins and vendors can update products"));
            }

            // For adding/removing tags, you could handle this separately with $addToSet/$pull
            // Here we simply overwrite the product document with the provided fields
            const updatedProduct = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true })
                .populate('category')
                .populate('tags');
            if (!updatedProduct) return next(createError.NotFound('Product not found'));
            res.status(200).json(updatedProduct);
        } catch (error) {
            next(createError.InternalServerError(error.message));
        }
    },

    // Method remains unchanged
    async deleteProduct(req, res, next) {
        try {
            const userId = req.payload.aud;
            const user = await User.findById(userId);

            if (user.role === 'Customer') {
                return next(createError.Forbidden("Only admins and vendors can delete products"));
            }

            const deletedProduct = await Product.findByIdAndDelete(req.params.id);
            if (!deletedProduct) return next(createError.NotFound('Product not found'));
            res.status(200).json({ message: 'Product successfully deleted' });
        } catch (error) {
            next(createError.InternalServerError(error.message));
        }
    },
    // Function to fetch products by store ID with detailed information
    async getProductsByStore(req, res, next) {
        try {
            const { storeId } = req.params;
            console.log("Fetching products for store ID:", storeId);
    
            // Find all inventory entries for the specified store and directly populate necessary product details
            const inventories = await Inventory.find({ storeId })
                .populate({
                    path: 'productId',
                    populate: {
                        path: 'category tags'
                    }
                });
    
            if (!inventories.length) {
                console.log("No inventory found for store ID:", storeId);
                return res.status(404).json({ message: 'No products found for this store' });
            }
    
            // Simplify the output directly in the map function
            const products = inventories.map(inventory => {
                const { productId } = inventory;
                if (!productId) {
                    console.log("Broken inventory record found, missing productId:", inventory);
                    return null;
                }
    
                // Construct the simplified product object
                return {
                    id: productId._id, // Keep the internal MongoDB ID
                    productCode: productId.productCode, // Correctly map productCode
                    name: productId.name,
                    description: productId.description,
                    category: productId.category ? { id: productId.category._id, name: productId.category.name } : null,
                    tags: productId.tags.map(tag => ({ id: tag._id, name: tag.name })),
                    price: productId.price,
                    images: productId.images,
                    variants: inventory.variants.map(variant => ({
                        color: variant.color,
                        size: variant.size,
                        quantity: variant.quantity
                    }))
                };
            }).filter(product => product != null); // Remove any null entries if productId was not populated
    
            console.log("Final product list:", products);
            res.status(200).json(products);
        } catch (error) {
            console.error("Failed to fetch products by store:", error);
            next(createError.InternalServerError("Internal Server Error: " + error.message));
        }
    },

    async bulkImportProducts(req, res, next) {
        console.log('Starting bulk import of products');
    
        if (!req.file) {
            console.error('No file uploaded');
            return next(new Error('No file uploaded'));
        }
    
        const collectionId = req.body.collectionId; // Get collection ID from request body
    
        try {
            console.log('Processing file:', req.file.originalname);
            let mapping = req.body.mapping;
    
            try {
                mapping = JSON.parse(mapping);
            } catch (error) {
                console.error('Error parsing mapping:', error);
                return res.status(400).send('Invalid mapping format');
            }
    
            const file = req.file;
            let productsData;
    
            if (file.mimetype === 'text/csv') {
                console.log('Processing a CSV file');
                const csvFile = fs.readFileSync(file.path, 'utf8');
                productsData = Papa.parse(csvFile, { header: true }).data;
                console.log('CSV file read successfully. Number of records:', productsData.length);
            } else if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
                console.log('Processing an Excel file');
                const workbook = xlsx.readFile(file.path);
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                productsData = xlsx.utils.sheet_to_json(worksheet);
                console.log('Excel sheet read successfully. Sheet name:', sheetName, 'Records:', productsData.length);
            } else {
                console.error('Unsupported file type:', file.mimetype);
                throw new Error('Unsupported file type');
            }
    
            const variantMappings = {
                color: mapping['variant-color'],
                size: mapping['variant-size'],
                quantity: mapping['variant-quantity'],
            };
    
            const categories = await Category.find();
            const categoryMap = new Map(categories.map(cat => [cat.name.toLowerCase(), cat._id]));
            const tags = await Tag.find();
            const tagMap = new Map(tags.map(tag => [tag.name.toLowerCase(), tag._id]));
    
            const brandId = mapping.brandId;
            delete mapping.brandId;
            const storeId = mapping.storeId;
            delete mapping.storeId;
    
            console.log(`Product data processing... Total records found: ${productsData.length}`);
    
            const productGroups = productsData.reduce((acc, data) => {
                const productName = data[mapping.name];
                const productCode = data[mapping.productCode]; // Assuming productCode is part of the mapping
                if (!acc[productName]) {
                    acc[productName] = {
                        name: productName,
                        brandId,
                        storeId,
                        category: undefined,
                        tags: [],
                        variants: [],
                        images: [],
                        description: data[mapping.description] || "No description provided",
                        price: parseFloat(data[mapping.price]) || 0,
                        productCode, // Add productCode here
                    };
                }
    
                const productEntry = acc[productName];
                const categoryName = data[mapping.category]?.toString().toLowerCase();
                const categoryId = categoryMap.get(categoryName);
                if (categoryId && !productEntry.category) {
                    productEntry.category = categoryId;
                }
    
                const tags = data[mapping.tags];
                if (tags && typeof tags === 'string') {
                    const tagIds = tags.split(',').map(name => name.trim().toLowerCase()).map(name => tagMap.get(name)).filter(id => id !== undefined);
                    productEntry.tags = [...new Set([...productEntry.tags, ...tagIds])]; // Avoid duplicates
                }
    
                const images = data[mapping.images];
                if (images && typeof images === 'string') {
                    const imageUrls = images.split(',').map(url => url.trim());
                    productEntry.images = [...new Set([...productEntry.images, ...imageUrls])]; // Avoid duplicates
                }
    
                const variant = {
                    color: data[variantMappings.color]?.toString().trim(),
                    size: data[variantMappings.size]?.toString().trim(),
                    quantity: parseInt(data[variantMappings.quantity], 10),
                };
    
                if (!isNaN(variant.quantity)) {
                    productEntry.variants.push(variant);
                }
    
                return acc;
            }, {});
    
            const productDataArray = Object.values(productGroups);
            const createdProducts = [];
    
            for (const productData of productDataArray) {
                const existingProduct = await Product.findOne({ productCode: productData.productCode });
                if (existingProduct) {
                    console.log(`Product with code ${productData.productCode} already exists. Using existing product ID.`);
                    createdProducts.push(existingProduct);
                } else {
                    const newProduct = new Product(productData);
                    const savedProduct = await newProduct.save();
                    console.log('Product saved:', savedProduct);
                    createdProducts.push(savedProduct);
                }
            }
    
            // Update the collection with the new products
            if (collectionId) {
                await Collection.findByIdAndUpdate(collectionId, {
                    $push: { products: { $each: createdProducts.map(prod => prod._id) } }
                });
                console.log('Collection updated with new products');
            }
    
            for (const createdProduct of createdProducts) {
                const productEntry = productDataArray.find(pd => pd.productCode === createdProduct.productCode);
                const inventoryData = productEntry.variants.map(variant => ({
                    productId: createdProduct._id,
                    storeId,
                    variants: [variant],
                }));
    
                console.log(`Inserting inventory for product ${createdProduct.name}:`, JSON.stringify(inventoryData, null, 2));
                try {
                    await Inventory.insertMany(inventoryData);
                    console.log(`Inventory created for product: ${createdProduct.name}`);
                } catch (error) {
                    console.error(`Error saving inventory for product ${createdProduct.name}:`, error);
                }
            }
    
            console.log('Bulk import successful');
            res.status(201).send('Bulk import successful');
        } catch (error) {
            console.error('Error during bulk import:', error);
            res.status(500).send('Error during bulk import');
        } finally {
            fs.unlink(req.file.path, (err) => {
                if (err) console.error('Error in deleting file:', err);
                else console.log('Uploaded file deleted successfully');
            });
        }
    }
    
    
    
};

module.exports = ProductController;
