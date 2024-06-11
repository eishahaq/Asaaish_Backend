const Inventory = require('../Models/Inventory'); 
const Store = require('../Models/Store');
const User = require('../Models/User');
const Product = require('../Models/Product');
const createError = require('http-errors');
const Vendor = require('../Models/Vendor');
const mongoose = require('mongoose');

const InventoryController = {
   
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
          
            const userId = req.payload.aud;
            const user = await User.findById(userId);
    
            if (user.role === 'Admin') {
                
                const inventoryItems = await Inventory.find().populate('productId').populate('storeId').exec();
                res.json(inventoryItems);
            } else {
               
                const vendorUserId = req.payload.aud;
                const vendor = await Vendor.findOne({ user: vendorUserId }).exec();
                if (!vendor) {
                    return res.status(404).json({ message: "Vendor not found" });
                }
    
                const inventoryItems = await Inventory.find({ 
                    storeId: { $in: vendor.stores }
                }).populate('productId').populate({
                    path: 'storeId',
                    match: { _id: { $in: vendor.stores }}
                }).exec();
    
                res.json(inventoryItems);
            }
        } catch (error) {
            console.error(error);
            next(error);
        }
    },
    
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

    async getInventoryByStore(req, res, next) {
        try {
            const inventory = await Inventory.find({ storeId: req.params.storeId }).populate('productId');
            if (!inventory) throw createError.NotFound('Inventory not found for given store');
            res.status(200).json(inventory);
        } catch (error) {
            next(error);
        }
    },

    
async getInventoryByStoreAndProduct(req, res, next) {
    try {
        const { storeId, productId } = req.params; 

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
        const { storeId } = req.params; 

        const inventoryItems = await Inventory.find({ storeId })
            .populate('productId')
            .exec();

        const products = inventoryItems.map(item => item.productId);

        const uniqueProducts = [...new Map(products.map(product => [product._id, product])).values()];

        if (!uniqueProducts.length) throw createError.NotFound('No products found for given store');

        res.status(200).json(uniqueProducts);
    } catch (error) {
        console.error(error);
        next(error);
    }
},

async updateInventory(req, res, next) {
    try {
        console.log('Update Inventory request received'); // Log the entry into the method
        console.log(`Request params: ${JSON.stringify(req.params)}`); // Log the request parameters
        console.log(`Request body: ${JSON.stringify(req.body)}`); // Log the request body

        // Ensure the id parameter is present
        if (!req.params.id) {
            console.error('Inventory ID parameter is missing');
            throw createError.BadRequest('Inventory ID parameter is missing');
        }

        // Extract productCode and variants from request body
        const { productCode, variants } = req.body;

        // Find product by productCode
        const product = await Product.findOne({ productCode });
        if (!product) {
            console.error('Product not found');
            throw createError.NotFound('Product not found');
        }

        // Find the inventory by ID
        const inventory = await Inventory.findById(req.params.id);
        if (!inventory) {
            console.error('Inventory not found');
            throw createError.NotFound('Inventory not found');
        }

        // Update the specific variant within the inventory
        inventory.variants = inventory.variants.map((variant) => {
            const updatedVariant = variants.find((v) => v.color === variant.color && v.size === variant.size);
            return updatedVariant ? { ...variant, quantity: updatedVariant.quantity } : variant;
        });

        // Save the updated inventory
        inventory.productId = product._id;
        const updatedInventory = await inventory.save();

        console.log('Updated inventory:', updatedInventory); // Log the updated inventory details
        res.status(200).json(updatedInventory);
    } catch (error) {
        console.error('Error updating inventory:', error.message); // Log any error that occurs
        next(error);
    }
}, 

async deleteInventory(req, res, next) {
    try {
        // Extract productCode from request body
        const { productCode } = req.body;

        // Find product by productCode
        const product = await Product.findOne({ productCode });
        if (!product) throw createError.NotFound('Product not found');

        // Delete inventory using product ID and inventory ID from params
        const deletedInventory = await Inventory.findOneAndDelete({
            _id: req.params.id,
            productId: product._id
        });

        if (!deletedInventory) throw createError.NotFound('Inventory not found');
        res.status(200).json({ message: 'Inventory successfully deleted' });
    } catch (error) {
        next(error);
    }
},


    async getProductVariants(req, res, next) {
        const { productId } = req.params;

  try {
    const inventoryItems = await Inventory.find({ productId: productId });
    
    let variants = {};
    
    inventoryItems.forEach((item) => {
      item.variants.forEach((variant) => {
        if (!variants[variant.color]) {
          variants[variant.color] = new Set();
        }
        variants[variant.color].add(variant.size);
      });
    });
    
    Object.keys(variants).forEach(color => {
      variants[color] = Array.from(variants[color]);
    });
    
    res.json(variants);
  } catch (error) {
    console.error(error);
    res.status(500).send('Server Error');
  }
},

async getAllInventoryLocations(req, res, next) {
    try {
        const inventoryList = await Inventory.find().populate('storeId');
        const locations = inventoryList.map(inventory => {
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
        const { inventoryId } = req.params;
        const inventoryItem = await Inventory.findById(inventoryId)
            .populate({
                path: 'storeId', 
                select: 'location' 
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
        }).filter(location => location !== undefined); 

        res.json(locations);
    } catch (error) {
        console.error(error);
        next(error);
    }
}


};



module.exports = InventoryController;
