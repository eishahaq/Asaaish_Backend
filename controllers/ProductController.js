
const Product = require('../models/Product'); 
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
            const user = await User.findById(userId);

            if (!['Admin', 'Vendor'].includes(user.role)) {
                return next(createError.Forbidden("Only admins and vendors can create products"));
            }

            const { id, brandId, name, description, category, tags, price, images, offers, collection } = req.body;

            // Validate the category
            const categoryExists = await Category.findById(category);
            if (!categoryExists) {
                return next(createError.BadRequest(`Category with ID ${category} does not exist`));
            }

            // Validate tags
            for (let tagId of tags) {
                const tagExists = await Tag.findById(tagId);
                if (!tagExists) {
                    return next(createError.BadRequest(`Tag with ID ${tagId} does not exist`));
                }
            }

            let productId;
            if (id) {
                productId = ObjectIdGenerator.encode(id);
            }

            const product = new Product({
                _id: productId,
                brandId,
                name,
                description,
                category, // Updated to singular category
                tags, // Added tags
                price,
                images,
                offers
            });

            await product.save();

            // If a collection ID is provided, add the product to the collection
            if (collection) {
                const collectionDoc = await Collection.findById(collection);
                if (!collectionDoc) {
                    return next(createError.BadRequest(`Collection with ID ${collection} does not exist`));
                }
                collectionDoc.products.push(product._id);
                await collectionDoc.save();
            }

            res.status(201).json(product);
        } catch (error) {
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
                    id: productId._id,
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
    // async bulkImportProducts(req, res, next) {
    //     console.log('Starting bulk import of products');
    
    //     if (!req.file) {
    //         console.error('No file uploaded');
    //         return next(new Error('No file uploaded'));
    //     }
    
    //     try {
    //         console.log('Processing file:', req.file.originalname);
    //         let mapping = req.body.mapping;
    
    //         try {
    //             mapping = JSON.parse(mapping);
    //         } catch (error) {
    //             console.error('Error parsing mapping:', error);
    //             return res.status(400).send('Invalid mapping format');
    //         }
    
    //         const file = req.file;
    //         let productsData;
    
    //         if (file.mimetype === 'text/csv') {
    //             console.log('Processing a CSV file');
    //             const csvFile = fs.readFileSync(file.path, 'utf8');
    //             productsData = Papa.parse(csvFile, { header: true }).data;
    //         } else if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
    //             console.log('Processing an Excel file');
    //             const workbook = xlsx.readFile(file.path);
    //             const sheetName = workbook.SheetNames[0];
    //             const worksheet = workbook.Sheets[sheetName];
    //             productsData = xlsx.utils.sheet_to_json(worksheet);
    //         } else {
    //             console.error('Unsupported file type:', file.mimetype);
    //             throw new Error('Unsupported file type');
    //         }

    //         const variantMappings = {
    //             color: mapping['variant-color'],
    //             size: mapping['variant-size'],
    //             quantity: mapping['variant-quantity'],
    //         };
    //         // Fetch all categories and create a map of name to _id
    //         const categories = await Category.find();
    //         const categoryMap = new Map(categories.map(cat => [cat.name.toLowerCase(), cat._id]));
            
    //         const tags = await Tag.find();
    //         const tagMap = new Map(tags.map(tag => [tag.name.toLowerCase(), tag._id]));

    //         const brandId = mapping.brandId;
    //         delete mapping.brandId;
    //         const storeId = mapping.storeId;
    //         delete mapping.storeId;
    
    //         console.log(`Number of products found: ${productsData.length}`);
    
    //         const products = productsData.map(data => {
    //             let productData = { brandId, storeId }; 

    //             for (let schemaField in mapping) {
    //                 const fileColumn = mapping[schemaField];
    //                 let value = data[fileColumn];
            
    //                 if (schemaField === 'category') {
    //                     if (value) {
    //                         const categoryName = value.toString().toLowerCase();
    //                         const categoryId = categoryMap.get(categoryName);
    //                         if (categoryId) {
    //                             productData[schemaField] = categoryId;
    //                         } else {
    //                             console.log(`Category '${value}' does not exist.`);
    //                         }
    //                     }
    //                 } else if (schemaField === 'tags' && value) {
    //                     let tagIds = [];
    //                     if (typeof value === 'string') {
    //                         if (value.includes(',')) {
    //                             tagIds = value.split(',').map(name => name.trim().toLowerCase())
    //                                           .map(name => tagMap.get(name)).filter(id => id !== undefined);
    //                         } else {
    //                             const tagId = tagMap.get(value.trim().toLowerCase());
    //                             if (tagId) {
    //                                 tagIds.push(tagId);
    //                             }
    //                         }
    //                     } else {
    //                         console.error(`Expected string for tags, got: ${typeof value}`);
    //                     }
    //                     if (tagIds.length > 0) {
    //                         productData[schemaField] = tagIds;
    //                     } else {
    //                         console.log(`Tags '${value}' do not exist or are not valid.`);
    //                     }
    //                 } else if (schemaField === 'images' && value) {
    //                     if (typeof value === 'string') {
    //                         console.log('Image data:', value); // Check what's coming in
    //                         productData[schemaField] = value.includes(',') ? value.split(',').map(url => url.trim()) : [value.trim()];
    //                     } else {
    //                         console.error(`Expected string for images, got: ${typeof value}`);
    //                     }
    //                 } else {
    //                     productData[schemaField] = value;
    //                 }
    //                 ['color', 'size', 'quantity'].forEach(variantField => {
    //                     const fileColumn = variantMappings[variantField];
    //                     if (fileColumn && data[fileColumn]) {
    //                         productData[variantField] = data[fileColumn].toString().trim();
    //                     }
    //                 });
                
    //             }
                
    //             console.log('Transformed Product Data:', productData);
    //             return productData;
    //         });
            
    //         const createdProducts = await Product.insertMany(products);
    //         console.log("products Inserted")    
       
    //         for (const product of createdProducts) {
    //             const productData = productsData.find(p => p[mapping.name] === product.name);
    //             if (!productData) {
    //     console.log(`Product data not found for: ${product.name}`);
    //     continue; // Skip if not found
    // }

    // const quantityValue = productData[variantMappings.quantity];
    // const parsedQuantity = parseInt(quantityValue, 10);

    // if (isNaN(parsedQuantity)) {
    //     console.error(`Invalid quantity value for product ${product.name}:`, quantityValue);
    //     continue; // Skip this product if quantity is not valid
    // }

    // const inventoryData = {
    //     productId: product._id,
    //     storeId, // Assuming storeId comes from the request body or another source
    //     variants: [{
    //         color: productData[variantMappings.color],
    //         size: productData[variantMappings.size],
    //         quantity: parsedQuantity,
    //     }],
    //     // Add any additional logic for inventory here, if needed
    // };

    // console.log(`Creating inventory for product: ${product.name}`, inventoryData);

    // const newInventory = new Inventory(inventoryData);
    // try {
    //     await newInventory.save();
    // } catch (error) {
    //     console.error(`Error saving inventory for product ${product.name}:`, error);
    // }
    //         }
    
    //         console.log('Bulk import successful');
    //         res.status(201).send('Bulk import successful');
    //     } catch (error) {
    //         console.error('Error during bulk import:', error);
    //         res.status(500).send('Error during bulk import');
    //     } finally {
    //         fs.unlink(req.file.path, (err) => {
    //             if (err) console.error('Error in deleting file:', err);
    //             else console.log('Uploaded file deleted successfully');
    //         });
    //     }
    // }
    // async bulkImportProducts(req, res, next) {
    //     console.log('Starting bulk import of products');
    
    //     if (!req.file) {
    //         console.error('No file uploaded');
    //         return next(new Error('No file uploaded'));
    //     }
    
    //     try {
    //         console.log('Processing file:', req.file.originalname);
    //         let mapping = req.body.mapping;
    
    //         try {
    //             mapping = JSON.parse(mapping);
    //         } catch (error) {
    //             console.error('Error parsing mapping:', error);
    //             return res.status(400).send('Invalid mapping format');
    //         }
    
    //         const file = req.file;
    //         let productsData;
    
    //         if (file.mimetype === 'text/csv') {
    //             console.log('Processing a CSV file');
    //             const csvFile = fs.readFileSync(file.path, 'utf8');
    //             productsData = Papa.parse(csvFile, { header: true }).data;
    //         } else if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
    //             console.log('Processing an Excel file');
    //             const workbook = xlsx.readFile(file.path);
    //             const sheetName = workbook.SheetNames[0];
    //             const worksheet = workbook.Sheets[sheetName];
    //             productsData = xlsx.utils.sheet_to_json(worksheet);
    //         } else {
    //             console.error('Unsupported file type:', file.mimetype);
    //             throw new Error('Unsupported file type');
    //         }
    
    //         const variantMappings = {
    //             color: mapping['variant-color'],
    //             size: mapping['variant-size'],
    //             quantity: mapping['variant-quantity'],
    //         };
    //         // Fetch all categories and create a map of name to _id
    //         const categories = await Category.find();
    //         const categoryMap = new Map(categories.map(cat => [cat.name.toLowerCase(), cat._id]));
    
    //         const tags = await Tag.find();
    //         const tagMap = new Map(tags.map(tag => [tag.name.toLowerCase(), tag._id]));
    
    //         const brandId = mapping.brandId;
    //         delete mapping.brandId;
    //         const storeId = mapping.storeId;
    //         delete mapping.storeId;
    
    //         console.log(`Number of products found: ${productsData.length}`);
    
    //         // Process products and group by a unique identifier
    //         const productGroups = productsData.reduce((acc, data) => {
    //             const productName = data[mapping.name];
    //             if (!acc[productName]) {
    //                 acc[productName] = {
    //                     name: productName,
    //                     brandId,
    //                     storeId,
    //                     category: undefined, // Initialize category
    //                     tags: [],
    //                     variants: [],
    //                     images: [],
    //                     description: data[mapping.description] || "No description provided",
    //                     price: parseFloat(data[mapping.price]) || 0,
    //                 };
    //             }
    
    //             const productEntry = acc[productName];
    //             // Handle category (assign the first valid category found)
    //             const categoryName = data[mapping.category]?.toString().toLowerCase();
    //             const categoryId = categoryMap.get(categoryName);
    //             if (categoryId && !productEntry.category) {
    //                 productEntry.category = categoryId;
    //             }
    
    //             // Handle tags
    //             const tags = data[mapping.tags];
    //             if (tags && typeof tags === 'string') {
    //                 const tagIds = tags.split(',').map(name => name.trim().toLowerCase()).map(name => tagMap.get(name)).filter(id => id !== undefined);
    //                 productEntry.tags = [...new Set([...productEntry.tags, ...tagIds])]; // Avoid duplicates
    //             }
    
    //             // Handle images
    //             const images = data[mapping.images];
    //             if (images && typeof images === 'string') {
    //                 const imageUrls = images.split(',').map(url => url.trim());
    //                 productEntry.images = [...new Set([...productEntry.images, ...imageUrls])]; // Avoid duplicates
    //             }
    
    //             // Handle variants
    //             const variant = {
    //                 color: data[variantMappings.color]?.toString().trim(),
    //                 size: data[variantMappings.size]?.toString().trim(),
    //                 quantity: parseInt(data[variantMappings.quantity], 10),
    //             };
    
    //             if (!isNaN(variant.quantity)) {
    //                 productEntry.variants.push(variant);
    //             }
    
    //             return acc;
    //         }, {});
    
    //         // Insert unique products into database
    //         const createdProducts = [];
    //         for (const productName in productGroups) {
    //             const productData = productGroups[productName];
    //             console.log('Transformed Product Data:', productData);
    //             const createdProduct = await Product.create(productData);
    //             createdProducts.push(createdProduct);
    
    //             // Handle inventory for each variant
    //             for (const variant of productData.variants) {
    //                 const inventoryData = {
    //                     productId: createdProduct._id,
    //                     storeId,
    //                     variants: [variant],
    //                 };
    //                 console.log(`Creating inventory for product: ${productName}`, inventoryData);
    //                 try {
    //                     const newInventory = new Inventory(inventoryData);
    //                     await newInventory.save();
    //                 } catch (error) {
    //                     console.error(`Error saving inventory for product ${productName}:`, error);
    //                 }
    //             }
    //         }
    
    //         console.log('Bulk import successful');
    //         res.status(201).send('Bulk import successful');
    //     } catch (error) {
    //         console.error('Error during bulk import:', error);
    //         res.status(500).send('Error during bulk import');
    //     } finally {
    //         fs.unlink(req.file.path, (err) => {
    //             if (err) console.error('Error in deleting file:', err);
    //             else console.log('Uploaded file deleted successfully');
    //         });
    //     }
    // }
    
    // async bulkImportProducts(req, res, next) {
    //     console.log('Starting bulk import of products');
    
    //     if (!req.file) {
    //         console.error('No file uploaded');
    //         return next(new Error('No file uploaded'));
    //     }
    
    //     try {
    //         console.log('Processing file:', req.file.originalname);
    //         let mapping = req.body.mapping;
    
    //         try {
    //             mapping = JSON.parse(mapping);
    //         } catch (error) {
    //             console.error('Error parsing mapping:', error);
    //             return res.status(400).send('Invalid mapping format');
    //         }
    
    //         const file = req.file;
    //         let productsData;
    
    //         if (file.mimetype === 'text/csv') {
    //             console.log('Processing a CSV file');
    //             const csvFile = fs.readFileSync(file.path, 'utf8');
    //             productsData = Papa.parse(csvFile, { header: true }).data;
    //         } else if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
    //             console.log('Processing an Excel file');
    //             const workbook = xlsx.readFile(file.path);
    //             const sheetName = workbook.SheetNames[0];
    //             const worksheet = workbook.Sheets[sheetName];
    //             productsData = xlsx.utils.sheet_to_json(worksheet);
    //         } else {
    //             console.error('Unsupported file type:', file.mimetype);
    //             throw new Error('Unsupported file type');
    //         }
    
    //         const variantMappings = {
    //             color: mapping['variant-color'],
    //             size: mapping['variant-size'],
    //             quantity: mapping['variant-quantity'],
    //         };
    //         // Fetch all categories and create a map of name to _id
    //         const categories = await Category.find();
    //         const categoryMap = new Map(categories.map(cat => [cat.name.toLowerCase(), cat._id]));
    
    //         const tags = await Tag.find();
    //         const tagMap = new Map(tags.map(tag => [tag.name.toLowerCase(), tag._id]));
    
    //         const brandId = mapping.brandId;
    //         delete mapping.brandId;
    //         const storeId = mapping.storeId;
    //         delete mapping.storeId;
    
    //         console.log(`Number of products found: ${productsData.length}`);
    
    //         // Process products and group by a unique identifier
    //         const productGroups = productsData.reduce((acc, data) => {
    //             const productName = data[mapping.name];
    //             if (!acc[productName]) {
    //                 acc[productName] = {
    //                     name: productName,
    //                     brandId,
    //                     storeId,
    //                     category: undefined, // Initialize category
    //                     tags: [],
    //                     variants: [],
    //                     images: [],
    //                     description: data[mapping.description] || "No description provided",
    //                     price: parseFloat(data[mapping.price]) || 0,
    //                 };
    //             }
    
    //             const productEntry = acc[productName];
    //             // Handle category (assign the first valid category found)
    //             const categoryName = data[mapping.category]?.toString().toLowerCase();
    //             const categoryId = categoryMap.get(categoryName);
    //             if (categoryId && !productEntry.category) {
    //                 productEntry.category = categoryId;
    //             }
    
    //             // Handle tags
    //             const tags = data[mapping.tags];
    //             if (tags && typeof tags === 'string') {
    //                 const tagIds = tags.split(',').map(name => name.trim().toLowerCase()).map(name => tagMap.get(name)).filter(id => id !== undefined);
    //                 productEntry.tags = [...new Set([...productEntry.tags, ...tagIds])]; // Avoid duplicates
    //             }
    
    //             // Handle images
    //             const images = data[mapping.images];
    //             if (images && typeof images === 'string') {
    //                 const imageUrls = images.split(',').map(url => url.trim());
    //                 productEntry.images = [...new Set([...productEntry.images, ...imageUrls])]; // Avoid duplicates
    //             }
    
    //             // Handle variants
    //             const variant = {
    //                 color: data[variantMappings.color]?.toString().trim(),
    //                 size: data[variantMappings.size]?.toString().trim(),
    //                 quantity: parseInt(data[variantMappings.quantity], 10),
    //             };
    
    //             if (!isNaN(variant.quantity)) {
    //                 productEntry.variants.push(variant);
    //             }
    
    //             return acc;
    //         }, {});
    
    //         // Insert unique products into database
    //         const createdProducts = [];
    //         for (const productName in productGroups) {
    //             const productData = productGroups[productName];
    //             console.log('Transformed Product Data:', productData);
    //             const createdProduct = await Product.create(productData);
    //             createdProducts.push(createdProduct);
    
    //             // Handle inventory for each variant
    //             for (const variant of productData.variants) {
    //                 const inventoryData = {
    //                     productId: createdProduct._id,
    //                     storeId,
    //                     variants: [variant],
    //                 };
    //                 console.log(`Creating inventory for product: ${productName}`, inventoryData);
    //                 try {
    //                     const newInventory = new Inventory(inventoryData);
    //                     await newInventory.save();
    //                 } catch (error) {
    //                     console.error(`Error saving inventory for product ${productName}:`, error);
    //                 }
    //             }
    //         }
    
    //         console.log('Bulk import successful');
    //         res.status(201).send('Bulk import successful');
    //     } catch (error) {
    //         console.error('Error during bulk import:', error);
    //         res.status(500).send('Error during bulk import');
    //     } finally {
    //         fs.unlink(req.file.path, (err) => {
    //             if (err) console.error('Error in deleting file:', err);
    //             else console.log('Uploaded file deleted successfully');
    //         });
    //     }
    // }
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
            const createdProducts = await Product.insertMany(productDataArray);
            console.log('Products inserted successfully:', JSON.stringify(createdProducts, null, 2));
    
            // Update the collection with the new products
            if (collectionId) {
                await Collection.findByIdAndUpdate(collectionId, {
                    $push: { products: { $each: createdProducts.map(prod => prod._id) } }
                });
                console.log('Collection updated with new products');
            }
    
            createdProducts.forEach(async (createdProduct, index) => {
                const productEntry = productDataArray[index];
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
            });
    
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

