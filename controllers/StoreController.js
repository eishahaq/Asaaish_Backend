const Store = require('../Models/Store'); 
const createError = require('http-errors');
const User = require('../Models/User');
const Vendor = require('../Models/Vendor');
const Brand = require('../Models/Brand');

const StoreController = {

    async createStore(req, res, next) {
        try {
            const userId = req.payload.aud;
            const user = await User.findById(userId);
    
            if (!user) {
                throw createError.NotFound("User not found");
            }
    
            if (user.role === 'Customer') {
                throw createError.Forbidden("Only admins and vendors can create stores");
            }
            console.log(user);
            const vendor = Vendor.findOne({ user: user._id });
            console.log(vendor);
    
            const { location, address, contactInfo, name, brand } = req.body;
            
            
            const store = new Store({
                brand,
                name,
                location: {
                    type: 'Point',
                    coordinates: location.coordinates
                },
                address,
                contactInfo
            });
    
            const savedStore = await store.save();
    
            if (user.role === 'Vendor') {
                await Vendor.findOneAndUpdate(
                    { user: userId },
                    { $push: { stores: savedStore._id } }
                );
            }
    
            res.status(201).json(savedStore);
        } catch (error) {
            next(error);
        }    
    },

    // Fetch all stores
    async getAllStores(req, res, next) {
        try {
            const userId = req.payload.aud;
            const user = await User.findById(userId);
            if (user.role === 'Customer' || user.role === 'Vendor') {
                throw createError.Forbidden("Only admins can access all stores");
            }
            const stores = await Store.find().populate('brand');
            res.status(200).json(stores);
        } catch (error) {
            next(error);
        }
    },

    async getVendorStores(req, res, next) {
        try {
            const userId = req.payload.aud;
            const user = await User.findById(userId);
            //console.log(user);
            if (user.role === 'Customer') {
                throw createError.Forbidden("Only admins and vendors can access this");
            }
        
            const vendorStores = await Vendor.findOne({ user: user._id }).populate('stores');

            if (!vendorStores) {
                throw createError.NotFound('Vendor or stores not found');
            }

            res.status(200).json(vendorStores.stores);
        } catch (error) {
            next(error);
        }
    },

    async getBrandStores(req, res, next) {
        try {
            const userId = req.payload.aud
            const user = await User.findById(userId);

            if (user.role === 'Customer' || user.role === 'Vendor') {
                throw createError.Forbidden("Only admins can access brand stores");
            }

            const brandStores = await Store.find({ store: Store.brand }).populate('brand');
            console.log(brandStores.length)

            if (!brandStores) {
                console.log("nobrandstores")
                throw createError.NotFound('Brand or stores not found');
            }

            res.status(200).json(brandStores);
        } catch (error) {
            next(error);
        }
    },
    async getStoresByBrand(req, res, next) {
        try {
            const brandId = req.params.brandId;
            console.log("storebybrand: " + brandId);
            
                console.log("im vendor");
                const storesdata = await Store.find({brand: brandId}).populate('brand');
                console.log("number of stores: " + storesdata.length);
    
                if (storesdata.length === 0) {
                    console.log("zero stores")
                    return res.status(404).json({ message: 'No products found for the specified brand' });
                }
    
                // This will only execute if storesdata.length > 0
                return res.status(200).json(storesdata);
           
        } catch (error) {
            next(error);
        }
    },
    
    

    async updateStore(req, res, next) {
        try {
            const userId = req.payload.aud;
            const user = await User.findById(userId);
            
            if (user.role === 'Customer') {
                throw createError.Forbidden("Only admins and vendors can update stores");
            }

            const updatedStore = await Store.findByIdAndUpdate(req.params.id, req.body, { new: true });
            if (!updatedStore) throw createError.NotFound('Store not found');
            res.status(200).json(updatedStore);
        } catch (error) {
            next(error);
        }
    },

    async deleteStore(req, res, next) {
        try {
            const userId = req.payload.aud;
            const user = await User.findById(userId);

            if (user.role === 'Customer') {
                throw createError.Forbidden("Only admins and vendors can delete stores");
            }

            if (req.payload.role !== 'Admin' && req.payload.role !== 'Vendor') {
                throw createError.Forbidden("Only admins and vendors can delete stores");
            }

            const deletedStore = await Store.findByIdAndDelete(req.params.id);
            if (!deletedStore) throw createError.NotFound('Store not found');
            res.status(200).json({ message: 'Store successfully deleted' });
        } catch (error) {
            next(error);
        }
    }
};

module.exports = StoreController;