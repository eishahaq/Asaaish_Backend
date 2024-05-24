const Collection = require('../Models/Collection'); 
const createError = require('http-errors');

const CollectionController = {
    async createCollection(req, res, next) {
        try {
            const { name, description, brand, products, images } = req.body;
            const collection = new Collection({ name, description, brand, products, images });
            const savedCollection = await collection.save();
            res.status(201).json(savedCollection);
        } catch (error) {
            next(createError(500, error.message));
        }
    },

    async getAllCollections(req, res, next) {
        try {
            const collections = await Collection.find().populate('brand').populate('products');
            res.json(collections);
        } catch (error) {
            next(createError(500, error.message));
        }
    },

    async getCollectionById(req, res, next) {
        try {
            const collection = await Collection.findById(req.params.id).populate('brand').populate('products');
            if (!collection) {
                return next(createError(404, 'Collection not found'));
            }
            res.json(collection);
        } catch (error) {
            next(createError(500, error.message));
        }
    },

    async updateCollection(req, res, next) {
        try {
            const updatedCollection = await Collection.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate('brand').populate('products');
            if (!updatedCollection) {
                return next(createError(404, 'Collection not found'));
            }
            res.json(updatedCollection);
        } catch (error) {
            next(createError(500, error.message));
        }
    },

    async deleteCollection(req, res, next) {
        try {
            const deletedCollection = await Collection.findByIdAndDelete(req.params.id);
            if (!deletedCollection) {
                return next(createError(404, 'Collection not found'));
            }
            res.json({ message: 'Collection successfully deleted' });
        } catch (error) {
            next(createError(500, error.message));
        }
    }
};

module.exports = CollectionController;
