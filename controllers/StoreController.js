const Store = require('../Models/Store');
const Vendor = require('../Models/Vendor');
const Brand = require('../Models/Brand');
const User = require('../Models/User')
const createError = require('http-errors');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');



const StoreController = {

    async createStore(req, res, next) {
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
            
            // Extract data from request body
            const { brandID, location, contactInfo, branchName } = req.body;

            // Convert branchName to lowercase
            const branch_name = branchName.toLowerCase();

            // Check if a store with the same branch name already exists
            const existingStore = await Store.findOne({ branchName: branch_name });
            if (existingStore) {
                throw createError.Conflict('Store with this branch name already exists');
            }

            // Create new store with lowercase branch name
            const newStore = new Store({
                storeID: new mongoose.Types.ObjectId(),
                brandID,
                vendorID: user._id,
                location,
                contactInfo,
                branchName: branch_name // Use lowercase branch name
            });

            const savedStore = await newStore.save();
            console.log('Store created successfully:', savedStore);
            res.status(201).send(savedStore);
        } catch (error) {
            console.error('Create store error:', error);
            next(error);
        }
    },

    async updateStore(req, res, next) {
        try {
            const { storeId } = req.params;
            const updateData = req.body;

            const updatedStore = await Store.findByIdAndUpdate(storeId, updateData, { new: true });
            if (!updatedStore) throw createError.NotFound('Store not found');

            res.send(updatedStore);
        } catch (error) {
            console.error('Update store error:', error);
            next(error);
        }
    },

    async getStore(req, res, next) {
        try {
            const { storeId } = req.params;

            const store = await Store.findById(storeId);
            if (!store) throw createError.NotFound('Store not found');

            res.send(store);
        } catch (error) {
            console.error('Get store error:', error);
            next(error);
        }
    },

    async deleteStore(req, res, next) {
        try {
            const { storeId } = req.params;

            const deletedStore = await Store.findByIdAndDelete(storeId);
            if (!deletedStore) throw createError.NotFound('Store not found');

            res.status(204).send();
        } catch (error) {
            console.error('Delete store error:', error);
            next(error);
        }
    }
};

module.exports = StoreController;
