const Store = require('../Models/Store'); // Adjust the path as necessary
const createError = require('http-errors');

const StoreController = {
    // Create a new store
    async createStore(req, res, next) {
        try {
            const { brandId, location, address, contactInfo } = req.body;
            const store = new Store({
                brandId,
                location: {
                  type: 'Point',
                  coordinates: location.coordinates // Expect coordinates as [longitude, latitude]
                },
                address,
                contactInfo
            });
            await store.save();
            res.status(201).json(store);
        } catch (error) {
            next(error);
        }
    },

    // Fetch all stores
    async getAllStores(req, res, next) {
        try {
            const stores = await Store.find().populate('brandId');
            res.status(200).json(stores);
        } catch (error) {
            next(error);
        }
    },

    // Fetch a single store by ID
    async getStoreById(req, res, next) {
        try {
            const store = await Store.findById(req.params.id).populate('brandId');
            if (!store) throw createError.NotFound('Store not found');
            res.status(200).json(store);
        } catch (error) {
            next(error);
        }
    },

    // Update a store
    async updateStore(req, res, next) {
        try {
            const updatedStore = await Store.findByIdAndUpdate(req.params.id, req.body, { new: true });
            if (!updatedStore) throw createError.NotFound('Store not found');
            res.status(200).json(updatedStore);
        } catch (error) {
            next(error);
        }
    },

    // Delete a store
    async deleteStore(req, res, next) {
        try {
            const deletedStore = await Store.findByIdAndDelete(req.params.id);
            if (!deletedStore) throw createError.NotFound('Store not found');
            res.status(200).json({ message: 'Store successfully deleted' });
        } catch (error) {
            next(error);
        }
    }
};

module.exports = StoreController;
