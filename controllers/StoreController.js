const Store = require('../Models/Store'); 
const createError = require('http-errors');

const StoreController = {
    async createStore(req, res, next) {
        try {
            if (req.payload.role !== 'Admin' && req.payload.role !== 'Vendor') {
                throw createError.Forbidden("Only admins and vendors can create stores");
            }
    
            const { location, address, contactInfo, vendorUserId } = req.body;
    
            let brandId, vendorUser;
            if (req.payload.role === 'Vendor') {
                const vendor = await Vendor.findOne({ user: req.payload.aud });
                if (!vendor) {
                    throw createError.NotFound("Vendor not found");
                }
                brandId = vendor.brand;
                vendorUser = vendor.user;
            } else {
                brandId = req.body.brandId;
                vendorUser = vendorUserId;
                if (!brandId || !vendorUser) {
                    throw createError.BadRequest("Admin must provide a brandId and vendorUserId");
                }
            }
    
            const store = new Store({
                brandId,
                location: {
                  type: 'Point',
                  coordinates: location.coordinates 
                },
                address,
                contactInfo
            });
            
            const savedStore = await store.save();
    
            await Vendor.findOneAndUpdate(
                { user: vendorUser },
                { $push: { stores: savedStore._id } }
            );
    
            res.status(201).json(savedStore);
        } catch (error) {
            next(error);
        }
    },

    async getAllStores(req, res, next) {
        try {
            if (req.payload.role !== 'Admin') {
                throw createError.Forbidden("Only admins can access all stores");
            }
            const stores = await Store.find().populate('brandId');
            res.status(200).json(stores);
        } catch (error) {
            next(error);
        }
    },

    async getVendorStores(req, res, next) {
        try {
            if (req.payload.role !== 'Admin' && req.payload.role !== 'Vendor') {
                throw createError.Forbidden("Only admins and vendors can access this");
            }

            let vendorId = req.payload.aud;
            if (req.payload.role === 'Admin' && req.query.vendorId) {
                vendorId = req.query.vendorId; // Allow admin to specify a vendor ID
            }

            const vendorStores = await Vendor.findOne({ user: vendorId })
                                             .populate('stores');
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
            if (req.payload.role !== 'Admin') {
                throw createError.Forbidden("Only admins can access brand stores");
            }

            const brandId = req.query.brandId;
            if (!brandId) {
                throw createError.BadRequest('Brand ID is required');
            }

            const brandStores = await Store.find({ brandId }).populate('brandId');
            res.status(200).json(brandStores);
        } catch (error) {
            next(error);
        }
    },

    async updateStore(req, res, next) {
        try {
            if (req.payload.role !== 'Admin' && req.payload.role !== 'Vendor') {
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
