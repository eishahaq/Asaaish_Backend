const Inventory = require('../Models/Inventory'); // Adjust the path as necessary
const Store = require('../Models/Store');
const User = require('../Models/User');
const Product = require('../Models/Product');
const createError = require('http-errors');
const Vendor = require('../Models/Vendor');
const mongoose = require('mongoose');

const InventoryController = {
    // Add new inventory
    async addInventory(req, res, next) {
        try {
            const { productId, storeId, variants, offers } = req.body;
            const inventory = new Inventory({
                productId,
                storeId,
                variants,
                offers
            });
            await inventory.save();
            console.log("Inventory Created Successfully")
            res.status(201).json(inventory);
        } catch (error) {
            next(error);
        }
    },

    async getAllInventory(req, res, next) {
        try {
            // Extract vendor ID from the token's audience field
            const vendorUserId = req.payload.aud;
    
            // Find the vendor by user ID
            const vendor = await Vendor.findOne({ user: vendorUserId }).exec();
            if (!vendor) {
                return res.status(404).json({ message: "Vendor not found" });
            }
    
            // Fetch inventory items that belong to the vendor's stores
            const inventoryItems = await Inventory.find({ 
                storeId: { $in: vendor.stores }
            }).populate('productId').populate({
                path: 'storeId',
                match: { _id: { $in: vendor.stores }}
            }).exec();
    
            // Return the inventory items
            res.json(inventoryItems);
        } catch (error) {
            console.error(error);
            next(error);
        }
    },

    // Get inventory by product ID
    async getInventoryByProduct(req, res, next) {
        try {
            const inventory = await Inventory.find({ productId: req.params.productId }).populate('storeId').populate('productId');
            if (!inventory) throw createError.NotFound('Inventory not found for given product');
            res.status(200).json(inventory);
            console.log(inventory);
        } catch (error) {
            next(error);
        }
    },

    // Get inventory by store ID
    async getInventoryByStore(req, res, next) {
        try {
            const inventory = await Inventory.find({ storeId: req.params.storeId }).populate('productId');
            if (!inventory) throw createError.NotFound('Inventory not found for given store');
            res.status(200).json(inventory);
        } catch (error) {
            next(error);
        }
    },

    // Update inventory
    async updateInventory(req, res, next) {
        try {
            console.log('Update Inventory request received'); // Log the entry into the method
            console.log(`Request params: ${JSON.stringify(req.params)}`); // Log the request parameters
            console.log(`Request body: ${JSON.stringify(req.body)}`); // Log the request body
    
            const updatedInventory = await Inventory.findByIdAndUpdate(req.params.id, req.body, { new: true });
    
            if (!updatedInventory) {
                console.error('Inventory not found'); // Log if the inventory is not found
                throw createError.NotFound('Inventory not found');
            }
    
            console.log('Updated inventory:', updatedInventory); // Log the updated inventory details
            res.status(200).json(updatedInventory);
        } catch (error) {
            console.error('Error updating inventory:', error.message); // Log any error that occurs
            next(error);
        }
    },
    // Get inventory by store ID and brand
// async getInventoryByStoreAndBrand(req, res, next) {
//     try {
//         // Extract storeId and brand from request parameters or query
//         const { storeId, brand } = req.params; // or req.query if you're using query parameters

//         // Find Product IDs by brand
//         const products = await Product.find({ brand }).exec();
//         const productIds = products.map(product => product._id);

//         // Find inventory by store ID and product IDs
//         const inventory = await Inventory.find({
//             storeId,
//             productId: { $in: productIds }
//         }).populate('productId').populate('storeId');

//         if (!inventory.length) throw createError.NotFound(`Inventory not found for given store and brand`);

//         res.status(200).json(inventory);
//     } catch (error) {
//         next(error);
//     }
// },
// Get inventory by store ID and product ID
async getInventoryByStoreAndProduct(req, res, next) {
    try {
        const { storeId, productId } = req.params; // Extract storeId and productId from URL parameters

        // Find inventory by store ID and product ID
        const inventory = await Inventory.findOne({
            storeId,
            productId
        }).populate('productId').populate('storeId');

        if (!inventory) throw createError.NotFound('Inventory not found for given store and product');

        res.status(200).json(inventory);
    } catch (error) {
        console.error(error);
        next(error);
    }
},

async getProductsByStore(req, res, next) {
    try {
        const { storeId } = req.params; // Assuming storeId is passed as a URL parameter

        // Find inventory items by store ID and populate the product details
        const inventoryItems = await Inventory.find({ storeId })
            .populate('productId')
            .exec();

        // Extract the populated products from the inventory items
        const products = inventoryItems.map(item => item.productId);

        // Optionally, you might want to remove duplicate products if any
        const uniqueProducts = [...new Map(products.map(product => [product._id, product])).values()];

        if (!uniqueProducts.length) throw createError.NotFound('No products found for given store');

        res.status(200).json(uniqueProducts);
    } catch (error) {
        console.error(error);
        next(error);
    }
},

    // Delete inventory
    async deleteInventory(req, res, next) {
        try {
            const deletedInventory = await Inventory.findByIdAndDelete(req.params.id);
            if (!deletedInventory) throw createError.NotFound('Inventory not found');
            res.status(200).json({ message: 'Inventory successfully deleted' });
        } catch (error) {
            next(error);
        }
    },

    async getAvailableProducts(req, res, next) {
        try {
            // Find all inventory items with quantity > 0
            const inventoryItems = await Inventory.find({
                'variants.quantity': { $gt: 0 }
            }).populate('productId');
    
            // Filter products and their available variants
            const products = {};
    
            inventoryItems.forEach(item => {
                const product = item.productId;
                if (!products[product._id]) {
                    products[product._id] = {
                        productId: product._id,
                        name: product.name,
                        description: product.description,
                        price: product.price,
                        images: product.images,
                        availableVariants: {}
                    };
                }
    
                item.variants.forEach(variant => {
                    if (variant.quantity > 0) {
                        if (!products[product._id].availableVariants[variant.color]) {
                            products[product._id].availableVariants[variant.color] = new Set();
                        }
                        products[product._id].availableVariants[variant.color].add(variant.size);
                    }
                });
            });
    
            // Convert sets to arrays for JSON serialization
            Object.keys(products).forEach(productId => {
                const variants = products[productId].availableVariants;
                Object.keys(variants).forEach(color => {
                    variants[color] = Array.from(variants[color]);
                });
            });
    
            res.json(Object.values(products));
        } catch (error) {
            console.error(error);
            res.status(500).send('Server Error');
        }
    },    

    async getAvailableProductVariants(req, res, next) {
        const { productId } = req.params;
    
        try {
            const inventoryItems = await Inventory.find({ productId: productId }).populate('storeId').populate('productId');
    
            if (!inventoryItems.length) {
                return res.status(404).json({ message: 'No inventory found for given product' });
            }
    
            const result = inventoryItems.map(item => {
                const variants = item.variants
                    .filter(variant => variant.quantity > 0)
                    .map(variant => ({
                        color: variant.color,
                        size: variant.size,
                        quantity: variant.quantity,
                        _id: variant._id
                    }));
    
                return {
                    _id: item._id,
                    productId: item.productId,
                    storeId: item.storeId,
                    variants: variants
                };
            });
    
            res.status(200).json(result);
        } catch (error) {
            console.error(error);
            res.status(500).send('Server Error');
        }
    }
    
    ,
    

    async getProductVariants(req, res, next) {
        const { productId } = req.params;
    
        try {
            const inventoryItems = await Inventory.find({ productId: productId });
            
            let variants = {};
            
            inventoryItems.forEach((item) => {
                item.variants.forEach((variant) => {
                    if (variant.quantity > 0) {
                        if (!variants[variant.color]) {
                            variants[variant.color] = new Set();
                        }
                        variants[variant.color].add(variant.size);
                    }
                });
            });
            
            // Convert sets to arrays for JSON serialization
            Object.keys(variants).forEach(color => {
                variants[color] = Array.from(variants[color]);
            });
            
            res.json(variants);
        } catch (error) {
            console.error(error);
            res.status(500).send('Server Error');
        }
    }
    ,

async getAllInventoryLocations(req, res, next) {
    try {
        const inventoryList = await Inventory.find().populate('storeId');
        const locations = inventoryList.map(inventory => {
            // Assuming the 'Store' model includes a 'location' field
            return {
                inventoryId: inventory._id,
                productId: inventory.productId,
                storeId: inventory.storeId._id,
                location: inventory.storeId.location
            };
        });
        res.status(200).json(locations);
    } catch (error) {
        next(createError.InternalServerError('Failed to fetch inventory locations'));
    }
},

async getStoreLocationByInventoryId(req, res, next) {
    try {
        const { inventoryId } = req.params; // Get inventoryId from URL parameters
        const inventoryItem = await Inventory.findById(inventoryId)
            .populate({
                path: 'storeId', // Assuming the Inventory schema has a 'storeId' field
                select: 'location' // Only fetch the location field from the Store document
            });

        if (!inventoryItem) {
            return res.status(404).json({ message: 'Inventory not found' });
        }

        if (!inventoryItem.storeId) {
            return res.status(404).json({ message: 'Store associated with this inventory not found' });
        }

        res.status(200).json({
            inventoryId: inventoryItem._id,
            storeId: inventoryItem.storeId._id,
            location: inventoryItem.storeId.location
        });
    } catch (error) {
        console.error(error);
        next(createError.InternalServerError('Failed to fetch store location for the given inventory'));
    }
},

async getAllStoreLocationsForProduct(req, res, next) {
    try {
        const { productId } = req.params;
        // Find inventories by product ID and populate both storeId and productId details
        const inventories = await Inventory.find({ productId: productId })
                                .populate('storeId')
                                .populate('productId');

        if (!inventories.length) {
            return res.status(404).json({ message: 'No inventories found for the given product ID' });
        }

        const locations = inventories.map(inventory => {
            if (inventory.storeId && inventory.storeId.location) {
                return {
                    storeId: inventory.storeId._id,
                    location: inventory.storeId.location,
                    name: inventory.storeId.name, 
                    address: inventory.storeId.address, 
                    variants: inventory.variants.map(variant => ({
                        color: variant.color,
                        size: variant.size,
                        quantity: variant.quantity
                    }))
                };
            }
        }).filter(location => location !== undefined); // Filter out any undefined values

        res.json(locations);
    } catch (error) {
        console.error(error);
        next(error);
    }
},
async getStoresByVariant(req, res, next) {
    try {
        const { productId, color, size } = req.query;
        if (!productId || !color || !size) {
            return next(createError.BadRequest('Product ID, color, and size are required.'));
        }

        // Find inventory items with the given product ID and variant
        const inventoryItems = await Inventory.find({
            productId,
            variants: { $elemMatch: { color, size } }
        }).populate('storeId');

        if (!inventoryItems.length) {
            return res.status(404).json({ message: 'No stores found for the given variant.' });
        }

        // Extract unique stores from the inventory items
        const stores = inventoryItems.map(item => item.storeId);

        res.status(200).json(stores);
    } catch (error) {
        next(error);
    }
}


};



module.exports = InventoryController;
