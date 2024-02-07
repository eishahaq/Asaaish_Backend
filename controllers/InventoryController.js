const Inventory = require('../Models/Inventory'); // Adjust the path as necessary
const createError = require('http-errors');

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
            res.status(201).json(inventory);
        } catch (error) {
            next(error);
        }
    },

    // Get inventory by product ID
    async getInventoryByProduct(req, res, next) {
        try {
            const inventory = await Inventory.find({ productId: req.params.productId }).populate('storeId').populate('productId');
            if (!inventory) throw createError.NotFound('Inventory not found for given product');
            res.status(200).json(inventory);
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
            const updatedInventory = await Inventory.findByIdAndUpdate(req.params.id, req.body, { new: true });
            if (!updatedInventory) throw createError.NotFound('Inventory not found');
            res.status(200).json(updatedInventory);
        } catch (error) {
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
    }
};

module.exports = InventoryController;
