
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

const shuffleArray = (array) => {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
};

const interleaveProducts = (products) => {
    const brandGroups = products.reduce((acc, product) => {
        const brandId = product.brandId._id.toString();
        if (!acc[brandId]) {
            acc[brandId] = [];
        }
        acc[brandId].push(product);
        return acc;
    }, {});

    const brandKeys = Object.keys(brandGroups);
    brandKeys.forEach(brand => {
        brandGroups[brand] = shuffleArray(brandGroups[brand]);
    });

    const result = [];
    const brandIndices = brandKeys.map(() => 0);
    let prevBrand = null;
    let count = 0;

    while (result.length < products.length) {
        let added = false;
        for (let i = 0; i < brandKeys.length; i++) {
            const brand = brandKeys[i];
            const index = brandIndices[i];

            if (index < brandGroups[brand].length && (brand !== prevBrand || count < 2)) {
                result.push(brandGroups[brand][index]);
                brandIndices[i]++;
                added = true;

                if (brand === prevBrand) {
                    count++;
                } else {
                    prevBrand = brand;
                    count = 1;
                }

                if (result.length >= products.length) {
                    break;
                }
            }
        }

        if (!added) {
            break;
        }
    }

    return result;
};
const ProductController = {
    async makeancomboOutfit(req, res, next) {
        try {
            const { color, budget, gender, style } = req.query;
            if (!color || !budget || !gender) {
                console.log("Color, budget, or gender missing");
                return next(createError.BadRequest('Color, budget, and gender are required.'));
            }
    
            // Convert budget to a number
            const budgetNumber = parseFloat(budget);
            if (isNaN(budgetNumber)) {
                console.log("Invalid budget");
                return next(createError.BadRequest('Budget must be a valid number.'));
            }
    
            // Define styles and associated tags
            const styles = {
                formal: ["formal", "semiformal", "embroidered", "stitched", "3-piece", "shirt collar", "band collar", "plain", "regular fit", "round collar"],
                fancy: ["fancy", "festive", "embellished", "schiffli", "jacquard", "radiant", "block-print", "chundri crochet", "silk", "raw silk", "digital printed"],
                casual: ["casual", "causal", "caual", "unstitched", "wash n wear", "twil", "cotton", "lawn", "slub lawn", "printed", "solid"],
                traditional: ["traditional", "pur noor", "khaadi net"],
                modern: ["modern"]
            };
    
            // Fetch products that have the specified gender tag
            const genderTag = await Tag.findOne({ name: gender.toLowerCase() }).lean();
            if (!genderTag) {
                console.log("Gender tag not found");
                return next(createError.BadRequest('Invalid gender specified.'));
            }
    
            let productQuery = { tags: genderTag._id };
    
            // If style is provided, add style tags to the query
            if (style && styles[style.toLowerCase()]) {
                const styleTags = await Tag.find({ name: { $in: styles[style.toLowerCase()] } }).lean();
                const styleTagIds = styleTags.map(tag => tag._id);
                console.log("Fetched style tags:", styleTags);
    
                // Update query to include style tags along with gender tag
                productQuery.tags = { $all: [genderTag._id], $in: styleTagIds };
            }
    
            const productsWithGenderAndStyleTags = await Product.find(productQuery).populate('tags category').lean();
            console.log("Fetched products with gender and style tags:", productsWithGenderAndStyleTags);
    
            // Fetch inventory items and filter by color in variants
            const inventoryItems = await Inventory.find({ productId: { $in: productsWithGenderAndStyleTags.map(p => p._id) } }).populate('productId').lean();
            console.log("Fetched inventory items:", inventoryItems);
    
            // Group products by their categories and filter by variant color
            const productsByCategory = {};
            const categoryNames = {}; // To store category names by product ID
    
            for (let item of inventoryItems) {
                if (!item.productId) continue;
    
                const matchingVariants = item.variants.filter(variant => variant.color.toLowerCase() === color.toLowerCase());
    
                if (matchingVariants.length > 0) {
                    console.log("Matching variants:", matchingVariants.length);
                    const product = item.productId;
                    const category = await Category.findById(product.category).lean();
                    const categoryName = category.name.toLowerCase();
    
                    if (!productsByCategory[categoryName]) {
                        productsByCategory[categoryName] = [];
                    }
    
                    // Store category name by product ID
                    categoryNames[product._id] = categoryName;
    
                    // Only add the product if it hasn't been added already
                    if (!productsByCategory[categoryName].some(p => p._id.equals(product._id))) {
                        productsByCategory[categoryName].push(product);
                    }
                }
            }
            console.log("Products grouped by category:", productsByCategory);
    
            const clothes = productsByCategory['clothes'] || [];
            const shoes = productsByCategory['shoes'] || [];
            const accessories = productsByCategory['accessories'] || [];
            const bags = productsByCategory['bags'] || [];
    
            if (clothes.length === 0) {
                console.log("No matching clothes found for the specified criteria");
            }
            if (shoes.length === 0) {
                console.log("No matching shoes found for the specified criteria");
            }
            if (accessories.length === 0) {
                console.log("No matching accessories found for the specified criteria");
            }
            if (bags.length === 0) {
                console.log("No matching bags found for the specified criteria");
            }
    
            let outfits = [];
    
            // Generate all possible combinations
            for (let cloth of clothes) {
                for (let shoe of shoes) {
                    let baseOutfit = {
                        products: [cloth, shoe],
                        totalPrice: cloth.price + shoe.price
                    };
    
                    if (baseOutfit.totalPrice <= budgetNumber) {
                        outfits.push({ ...baseOutfit });
                    }
    
                    for (let accessory of accessories) {
                        if (baseOutfit.totalPrice + accessory.price <= budgetNumber) {
                            outfits.push({
                                products: [...baseOutfit.products, accessory],
                                totalPrice: baseOutfit.totalPrice + accessory.price
                            });
                        }
                    }
    
                    for (let bag of bags) {
                        if (baseOutfit.totalPrice + bag.price <= budgetNumber) {
                            outfits.push({
                                products: [...baseOutfit.products, bag],
                                totalPrice: baseOutfit.totalPrice + bag.price
                            });
                        }
                    }
    
                    for (let accessory of accessories) {
                        for (let bag of bags) {
                            if (baseOutfit.totalPrice + accessory.price + bag.price <= budgetNumber) {
                                outfits.push({
                                    products: [...baseOutfit.products, accessory, bag],
                                    totalPrice: baseOutfit.totalPrice + accessory.price + bag.price
                                });
                            }
                        }
                    }
                }
            }
    
            // Generate combinations of just two categories, ensuring clothes are included
            for (let cloth of clothes) {
                for (let accessory of accessories) {
                    if (cloth.price + accessory.price <= budgetNumber) {
                        outfits.push({
                            products: [cloth, accessory],
                            totalPrice: cloth.price + accessory.price
                        });
                    }
                }
                for (let bag of bags) {
                    if (cloth.price + bag.price <= budgetNumber) {
                        outfits.push({
                            products: [cloth, bag],
                            totalPrice: cloth.price + bag.price
                        });
                    }
                }
            }
    
            if (outfits.length === 0) {
                console.log("No outfits found within the budget");
                return res.status(200).json({ message: 'No outfits found within the budget.' });
            }
    
            // Filter to keep only the outfits with the maximum number of products
            const maxProductCount = Math.max(...outfits.map(outfit => outfit.products.length));
            const filteredOutfits = outfits.filter(outfit => outfit.products.length === maxProductCount);
    
            // Remove duplicates by using a set to track unique product combinations
            const uniqueOutfits = [];
            const seenCombinations = new Set();
    
            for (let outfit of filteredOutfits) {
                const hasClothes = outfit.products.some(p => categoryNames[p._id.toString()] === 'clothes');
                if (!hasClothes) continue;
    
                const sortedProductIds = outfit.products.map(p => p._id.toString()).sort();
                const combinationKey = sortedProductIds.join('-');
                if (!seenCombinations.has(combinationKey)) {
                    seenCombinations.add(combinationKey);
                    uniqueOutfits.push(outfit);
                }
            }
    
            // Sort outfits by totalPrice (optional)
            uniqueOutfits.sort((a, b) => a.totalPrice - b.totalPrice);
    
            res.status(200).json(uniqueOutfits);
        } catch (error) {
            console.error("Error in makeancomboOutfit:", error);
            next(createError.InternalServerError(error.message));
        }
    }
    
    
    ,    

    async makeOutfit(req, res, next) {
        try {
            const { color, budget, gender, style } = req.query;
            if (!color || !budget || !gender) {
                console.log("Color, budget, or gender missing");
                return next(createError.BadRequest('Color, budget, and gender are required.'));
            }
    
            // Convert budget to a number
            const budgetNumber = parseFloat(budget);
            if (isNaN(budgetNumber)) {
                console.log("Invalid budget");
                return next(createError.BadRequest('Budget must be a valid number.'));
            }
    
            // Define styles and associated tags
            const styles = {
                formal: ["formal", "semiformal", "embroidered", "stitched", "3-piece", "shirt collar", "band collar", "plain", "regular fit", "round collar"],
                fancy: ["fancy", "festive", "embellished", "schiffli", "jacquard", "radiant", "block-print", "chundri crochet", "silk", "raw silk", "digital printed"],
                casual: ["casual", "causal", "caual", "unstitched", "wash n wear", "twil", "cotton", "lawn", "slub lawn", "printed", "solid"],
                traditional: ["traditional", "pur noor", "khaadi net"],
                modern: ["modern"]
            };
    
            // Fetch products that have the specified gender tag
            const genderTag = await Tag.findOne({ name: gender.toLowerCase() }).lean();
            if (!genderTag) {
                console.log("Gender tag not found");
                return next(createError.BadRequest('Invalid gender specified.'));
            }
    
            let productQuery = { tags: genderTag._id };
    
            // If style is provided, add style tags to the query
            if (style && styles[style.toLowerCase()]) {
                const styleTags = await Tag.find({ name: { $in: styles[style.toLowerCase()] } }).lean();
                const styleTagIds = styleTags.map(tag => tag._id);
                console.log("Fetched style tags:", styleTags);
    
                // Update query to include style tags along with gender tag
                productQuery.tags = { $all: [genderTag._id], $in: styleTagIds };
            }
    
            const productsWithGenderAndStyleTags = await Product.find(productQuery).populate('tags category').lean();
            console.log("Fetched products with gender and style tags:", productsWithGenderAndStyleTags);
    
            // Fetch inventory items and filter by color in variants
            const inventoryItems = await Inventory.find({ productId: { $in: productsWithGenderAndStyleTags.map(p => p._id) } }).populate('productId').lean();
            console.log("Fetched inventory items:", inventoryItems);
    
            // Group products by their categories and filter by variant color
            const productsByCategory = {};
            const categoryNames = {}; // To store category names by product ID
    
            for (let item of inventoryItems) {
                if (!item.productId) continue;
    
                const matchingVariants = item.variants.filter(variant => variant.color.toLowerCase() === color.toLowerCase());
    
                if (matchingVariants.length > 0) {
                    console.log("Matching variants:", matchingVariants.length);
                    const product = item.productId;
                    const category = await Category.findById(product.category).lean();
                    const categoryName = category.name.toLowerCase();
    
                    if (!productsByCategory[categoryName]) {
                        productsByCategory[categoryName] = [];
                    }
    
                    // Store category name by product ID
                    categoryNames[product._id] = categoryName;
    
                    // Only add the product if it hasn't been added already
                    if (!productsByCategory[categoryName].some(p => p._id.equals(product._id))) {
                        productsByCategory[categoryName].push(product);
                    }
                }
            }
            console.log("Products grouped by category:", productsByCategory);
    
            const clothes = productsByCategory['clothes'] || [];
            const shoes = productsByCategory['shoes'] || [];
            const accessories = productsByCategory['accessories'] || [];
            const bags = productsByCategory['bags'] || [];
    
            let outfits = [];
    
            // Generate all possible combinations
            for (let cloth of clothes) {
                let baseOutfit = {
                    products: [cloth],
                    totalPrice: cloth.price
                };
    
                if (baseOutfit.totalPrice <= budgetNumber) {
                    outfits.push({ ...baseOutfit });
                }
    
                for (let shoe of shoes) {
                    if (baseOutfit.totalPrice + shoe.price <= budgetNumber) {
                        outfits.push({
                            products: [...baseOutfit.products, shoe],
                            totalPrice: baseOutfit.totalPrice + shoe.price
                        });
                    }
                }
    
                for (let accessory of accessories) {
                    if (baseOutfit.totalPrice + accessory.price <= budgetNumber) {
                        outfits.push({
                            products: [...baseOutfit.products, accessory],
                            totalPrice: baseOutfit.totalPrice + accessory.price
                        });
                    }
                }
    
                for (let bag of bags) {
                    if (baseOutfit.totalPrice + bag.price <= budgetNumber) {
                        outfits.push({
                            products: [...baseOutfit.products, bag],
                            totalPrice: baseOutfit.totalPrice + bag.price
                        });
                    }
                }
    
                for (let shoe of shoes) {
                    for (let accessory of accessories) {
                        if (baseOutfit.totalPrice + shoe.price + accessory.price <= budgetNumber) {
                            outfits.push({
                                products: [...baseOutfit.products, shoe, accessory],
                                totalPrice: baseOutfit.totalPrice + shoe.price + accessory.price
                            });
                        }
                    }
    
                    for (let bag of bags) {
                        if (baseOutfit.totalPrice + shoe.price + bag.price <= budgetNumber) {
                            outfits.push({
                                products: [...baseOutfit.products, shoe, bag],
                                totalPrice: baseOutfit.totalPrice + shoe.price + bag.price
                            });
                        }
                    }
    
                    for (let accessory of accessories) {
                        for (let bag of bags) {
                            if (baseOutfit.totalPrice + shoe.price + accessory.price + bag.price <= budgetNumber) {
                                outfits.push({
                                    products: [...baseOutfit.products, shoe, accessory, bag],
                                    totalPrice: baseOutfit.totalPrice + shoe.price + accessory.price + bag.price
                                });
                            }
                        }
                    }
                }
            }
    
            // Also allow outfits with just one product from the clothes category
            for (let cloth of clothes) {
                if (cloth.price <= budgetNumber) {
                    outfits.push({
                        products: [cloth],
                        totalPrice: cloth.price
                    });
                }
            }
    
            if (outfits.length === 0) {
                console.log("No outfits found within the budget");
                return res.status(200).json({ message: 'No outfits found within the budget.' });
            }
    
            // Filter to keep only the outfits with the maximum number of products
            const maxProductCount = Math.max(...outfits.map(outfit => outfit.products.length));
            const filteredOutfits = outfits.filter(outfit => outfit.products.length === maxProductCount);
    
            // Remove duplicates by using a set to track unique product combinations
            const uniqueOutfits = [];
            const seenCombinations = new Set();
    
            for (let outfit of filteredOutfits) {
                const hasClothes = outfit.products.some(p => categoryNames[p._id.toString()] === 'clothes');
                if (!hasClothes) continue;
    
                const sortedProductIds = outfit.products.map(p => p._id.toString()).sort();
                const combinationKey = sortedProductIds.join('-');
                if (!seenCombinations.has(combinationKey)) {
                    seenCombinations.add(combinationKey);
                    uniqueOutfits.push(outfit);
                }
            }
    
            // Sort outfits by totalPrice (optional)
            uniqueOutfits.sort((a, b) => a.totalPrice - b.totalPrice);
    
            res.status(200).json(uniqueOutfits);
        } catch (error) {
            console.error("Error in makeOutfit:", error);
            next(createError.InternalServerError(error.message));
        }
    }
    
,    
    
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

     
     async getAllProducts(req, res, next) {
        try {
            let sort = {};
            if (req.query.sortBy) {
                const [key, order] = req.query.sortBy.split(':');
                sort[key] = order === 'desc' ? -1 : 1;
            }

            const products = await Product.find().populate('brandId category tags').sort(sort);
            res.status(200).json(products);
        } catch (error) {
            next(createError.InternalServerError(error.message));
        }
    },

    async getAllProductsShuffled(req, res, next) {
        try {
            // Fetch all products and populate necessary fields
            let products = await Product.find().populate('brandId category tags').exec();
    
            let mixedProducts = [];
            while (products.length > 0) {
                if (products.length > 0) mixedProducts.push(products.shift()); // Start
                if (products.length > 0) mixedProducts.push(products.pop());   // End
                if (products.length > 0) mixedProducts.push(products.splice(Math.floor(products.length / 2), 1)[0]); // Middle
            }
    
            // Respond with the mixed products
            res.status(200).json(mixedProducts);
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

    async getProductsByCategory(req, res, next) {
        try {
            let sort = {};
            if (req.query.sortBy) {
                const [key, order] = req.query.sortBy.split(':');
                sort[key] = order === 'desc' ? -1 : 1;
            }
            console.log('Sorting by:', sort);  // Debug: Check the sort object
    
            const { categoryId } = req.params;
            const products = await Product.find({ category: categoryId })
                .populate('brandId category tags')
                .sort(sort);
    
            console.log('Fetched products:', products.length);  // Debug: Check the fetched count
            res.status(200).json(products);
        } catch (error) {
            console.log('Error fetching products by category:', error);  // Debug: Error details
            next(createError.InternalServerError(error.message));
        }
    }
    ,      
    async getProductsByTags(req, res, next) {
        try {
            const { tagIds } = req.query; // Assuming tagIds are passed as a comma-separated string
            console.log(tagIds);
            const tagArray = tagIds.split(',').map(tag => new mongoose.Types.ObjectId(tag));
            const products = await Product.find({ tags: { $all: tagArray } }) // Change to $all for AND relationship
                .populate('brandId')
                .populate('category')
                .populate('tags');
            console.log(products);
            res.status(200).json(products);
        } catch (error) {
            next(createError.InternalServerError(error.message));
        }
    }
      ,
   // Updated to handle tag addition/removal and populate 'tags'
// Updated to handle tag addition/removal and populate 'tags'
async updateProduct(req, res, next) {
    try {
        const userId = req.payload.aud;
        console.log(`User ID from token: ${userId}`); // Log the user ID from the token

        const user = await User.findById(userId);
        if (!user) {
            console.error('User not found'); // Log if the user is not found
            return next(createError.NotFound('User not found'));
        }
        console.log(`User found: ${user}`); // Log the user details

        if (user.role === 'Customer') {
            console.error('User role is Customer, not allowed to update products'); // Log if the user role is Customer
            return next(createError.Forbidden("Only admins and vendors can update products"));
        }

        console.log('Request body:', req.body); // Log the request body

        // Validate and convert category to ObjectId
        if (req.body.category && typeof req.body.category === 'object' && req.body.category.id) {
            req.body.category = req.body.category.id;
        }

        // Validate and convert tags to ObjectIds
        if (req.body.tags && Array.isArray(req.body.tags)) {
            req.body.tags = req.body.tags.filter(tag => tag).map(tag => tag._id || tag); // Ensure tags are ObjectIds
        }

        // For adding/removing tags, you could handle this separately with $addToSet/$pull
        // Here we simply overwrite the product document with the provided fields
        const updatedProduct = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true })
            .populate('category')
            .populate('tags');

        if (!updatedProduct) {
            console.error('Product not found'); // Log if the product is not found
            return next(createError.NotFound('Product not found'));
        }

        console.log('Updated product:', updatedProduct); // Log the updated product details
        res.status(200).json(updatedProduct);
    } catch (error) {
        console.error('Error updating product:', error.message); // Log any error that occurs
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
    async getInventoryByStore(req, res, next) {
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
                return res.status(404).json({ message: 'No products found for this store' });
            }
    
            // Simplify the output directly in the map function
            const products = inventories.map(inventory => {
                const { productId } = inventory;
                if (!productId) {
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
    
            res.status(200).json(products);
            console.log("Product Fetch Successful");

        } catch (error) {
            console.error("Failed to fetch products by store:", error);
            next(createError.InternalServerError("Internal Server Error: " + error.message));
        }
    },
    // Function to fetch unique products by store ID
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
            return res.status(404).json({ message: 'No products found for this store' });
        }

        // Construct the product response and ensure uniqueness by productCode
        const productMap = new Map();

        inventories.forEach(inventory => {
            const { productId } = inventory;
            if (!productId) {
                return;
            }

            if (!productMap.has(productId.productCode)) {
                productMap.set(productId.productCode, {
                    id: productId._id,
                    productCode: productId.productCode,
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
                });
            }
        });

        const uniqueProducts = Array.from(productMap.values());

        res.status(200).json(uniqueProducts);
        console.log("Product Fetch Successful");

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
    
    //     const collectionId = req.body.collectionId; // Get collection ID from request body
    
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
    //             console.log('CSV file read successfully. Number of records:', productsData.length);
    //         } else if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
    //             console.log('Processing an Excel file');
    //             const workbook = xlsx.readFile(file.path);
    //             const sheetName = workbook.SheetNames[0];
    //             const worksheet = workbook.Sheets[sheetName];
    //             productsData = xlsx.utils.sheet_to_json(worksheet);
    //             console.log('Excel sheet read successfully. Sheet name:', sheetName, 'Records:', productsData.length);
    //         } else {
    //             console.error('Unsupported file type:', file.mimetype);
    //             throw new Error('Unsupported file type');
    //         }
    
    //         const totalRows = productsData.length;
    //         console.log(`Total rows in file: ${totalRows}`);
    
    //         const variantMappings = {
    //             color: mapping['variant-color'],
    //             size: mapping['variant-size'],
    //             quantity: mapping['variant-quantity'],
    //         };
    
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
    //             const productCode = data[mapping.productCode]; // Assuming productCode is part of the mapping
    //             if (!productGroups[productCode]) {
    //                 productGroups[productCode] = {
    //                     name: productName,
    //                     brandId,
    //                     storeId,
    //                     category: undefined,
    //                     tags: [],
    //                     variants: [],
    //                     images: [],
    //                     description: data[mapping.description] || "No description provided",
    //                     price: parseFloat(data[mapping.price]) || 0,
    //                     productCode, // Add productCode here
    //                 };
    //             }
    
    //             const productEntry = productGroups[productCode];
    //             const categoryName = data[mapping.category]?.toString().toLowerCase();
    //             const categoryId = categoryMap.get(categoryName);
    //             if (categoryId && !productEntry.category) {
    //                 productEntry.category = categoryId;
    //             }
    
    //             const tags = data[mapping.tags];
    //             if (tags && typeof tags === 'string') {
    //                 const tagNames = tags.split(',').map(name => name.trim().toLowerCase());
    //                 productEntry.tags.push(...new Set(tagNames)); // Store unique tag names
    //             }
    
    //             const images = data[mapping.images];
    //             if (images && typeof images === 'string') {
    //                 const imageUrls = images.split(',').map(url => url.trim());
    //                 productEntry.images = [...new Set([...productEntry.images, ...imageUrls])]; // Avoid duplicates
    //             }
    
    //             const variant = {
    //                 color: data[variantMappings.color]?.toString().trim(),
    //                 size: data[variantMappings.size]?.toString().trim(),
    //                 quantity: parseInt(data[variantMappings.quantity], 10),
    //             };
    
    //             if (!isNaN(variant.quantity)) {
    //                 productEntry.variants.push(variant);
    //             }
    //         }
    
    //         console.log(`Products grouped by product code: ${Object.keys(productGroups).length}`);
    
    //         // Second pass to resolve tags and create products
    //         const productDataArray = Object.values(productGroups);
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
    
    //         console.log(`Total unique products processed: ${productDataArray.length}`);
    
    //         // Update the collection with the new products
    //         if (collectionId) {
    //             await Collection.findByIdAndUpdate(collectionId, {
    //                 $push: { products: { $each: createdProducts.map(prod => prod._id) } }
    //             });
    //             console.log('Collection updated with new products');
    //         }
    
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
    
            const totalRows = productsData.length;
            console.log(`Total rows in file: ${totalRows}`);
    
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
    
            const productGroups = {};
    
            // First pass to gather and group product data
            for (const data of productsData) {
                const productName = data[mapping.name];
                const productCode = data[mapping.productCode]; // Assuming productCode is part of the mapping
                if (!productGroups[productCode]) {
                    productGroups[productCode] = {
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
    
                const productEntry = productGroups[productCode];
                const categoryName = data[mapping.category]?.toString().toLowerCase();
                const categoryId = categoryMap.get(categoryName);
                if (categoryId && !productEntry.category) {
                    productEntry.category = categoryId;
                }
    
                const tags = data[mapping.tags];
                if (tags && typeof tags === 'string') {
                    const tagNames = tags.split(',').map(name => name.trim().toLowerCase());
                    productEntry.tags.push(...new Set(tagNames)); // Store unique tag names
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
            }
    
            console.log(`Products grouped by product code: ${Object.keys(productGroups).length}`);
    
            // Second pass to resolve tags and create products
            const productDataArray = Object.values(productGroups);
            const createdProducts = [];
            const existingProductsMap = new Map();
    
            for (const productData of productDataArray) {
                // Resolve and create tags if they don't exist
                const resolvedTagIds = [];
                for (const tagName of productData.tags) {
                    let tagId = tagMap.get(tagName);
                    if (!tagId) {
                        console.log(`Creating new tag: ${tagName}`);
                        const newTag = new Tag({
                            name: tagName,
                            parentCategory: productData.category // Set the parentCategory here
                        });
                        const savedTag = await newTag.save();
                        console.log(`New tag created: ${savedTag.name} with ID: ${savedTag._id}`);
                        tagId = savedTag._id;
                        tagMap.set(tagName, tagId);
                    }
                    resolvedTagIds.push(tagId);
                }
                productData.tags = [...new Set(resolvedTagIds)]; // Avoid duplicates
    
                let existingProduct = existingProductsMap.get(productData.productCode);
                if (!existingProduct) {
                    existingProduct = await Product.findOne({ productCode: productData.productCode });
                    if (existingProduct) {
                        console.log(`Product with code ${productData.productCode} already exists. Using existing product ID.`);
                        existingProductsMap.set(productData.productCode, existingProduct);
                        createdProducts.push(existingProduct);
                    } else {
                        try {
                            const newProduct = new Product(productData);
                            const savedProduct = await newProduct.save();
                            console.log('Product saved:', savedProduct);
                            existingProductsMap.set(productData.productCode, savedProduct);
                            createdProducts.push(savedProduct);
                        } catch (error) {
                            console.error(`Error saving product ${productData.productCode}:`, error);
                        }
                    }
                }
            }
    
            console.log(`Total unique products processed: ${productDataArray.length}`);
    
            // Update the collection with the new products
            if (collectionId) {
                await Collection.findByIdAndUpdate(collectionId, {
                    $push: { products: { $each: createdProducts.map(prod => prod._id) } }
                });
                console.log('Collection updated with new products');
            }
    
            // Create inventory for each product per store with all its variants
            for (const createdProduct of createdProducts) {
                const productEntry = productDataArray.find(pd => pd.productCode === createdProduct.productCode);
                const inventoryData = {
                    productId: createdProduct._id,
                    storeId,
                    variants: productEntry.variants,
                };
    
                console.log(`Inserting inventory for product ${createdProduct.name}:`, JSON.stringify(inventoryData, null, 2));
                try {
                    await Inventory.create(inventoryData);
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
