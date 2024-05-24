const User = require('../Models/User');
const { verifyAccessToken } = require('../Helpers/JwtHelper');
const Vendor = require('../Models/Vendor');
const Customer = require('../Models/Customer');
const createError = require('http-errors');

const UserController = {
    async getAllUsers(req, res, next) {
        try {
            const userId = req.payload.aud;
            const user = await User.findById(userId);
            if (user.role !== 'Admin') {
                throw createError.Forbidden("Only admins can access all users");
            }
            const users = await User.find();
            res.status(200).json({ data: users });
        } catch (err) {
            next(err);
        }
    },
    

    async getUserById(req, res, next) {
        try {
            const userId = req.payload.aud;
    
            const user = await User.findById(userId);
            if (!user) {
                throw createError.NotFound("User not found");
            }
    
            res.status(200).json({ User: user });
        } catch (err) {
            next(err);
        }
    },

    async updateUser(req, res, next) {
        try {
            const userId = req.payload.aud;
            const user = await User.findById(userId);
            if (user.role === 'Customer') {
                throw createError.Forbidden("Only admins and vendors can update stores");
            }
              const updatedUser = await Customer.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate('user');
              if (!updatedUser) {
                throw createError.NotFound('User not found');
              }
              res.status(200).json(updatedUser);
            } catch (error) {
              next(error);
            }
          },
    
    async deleteUser(req, res, next) {
        try {
            const userId = req.payload.aud;
            const user = await User.findById(userId);
            if (user.role !== 'Admin') {
                throw createError.Forbidden("Only admins can delete users");
            }

            const result = await User.findByIdAndUpdate(
                req.params.id,
                { $set: { status: "INACTIVE" } },
                { new: true }
            );
            

            if (!result) {
                throw createError.NotFound("User not found");
            }

            res.status(200).json({ updated_user: result, message: "User has been set to INACTIVE" });
        } catch (err) {
            next(err);
        }
    },

    async getAllVendors(req, res, next) {
        try {
            const vendors = await Vendor.find().populate('user brand stores');
            res.status(200).json(vendors);
        } catch (error) {
            next(error);
        }
    },

    async getVendorByUserId(req, res, next) {
        try {
            console.log('getVendorByUserId function started');
    
            const userId = req.payload.aud; 
            console.log('User ID:', userId);
    
            console.log('Fetching vendor for user ID:', userId);
    
            const vendor = await Vendor.findOne({ user: userId })
              .populate('user')
              .populate('brand')
              .populate('stores');
    
            console.log('Vendor fetch successful for user ID:', userId);
    
            if (!vendor) {
                console.log('Vendor not found for user ID:', userId); 
                throw createError.NotFound('Vendor not found');
            }
    
            console.log('Vendor details:', vendor);
    
            res.status(200).json(vendor);
    
            console.log('getVendorByUserId function completed successfully');
        } catch (error) {
            console.error('Error in getVendorByUserId function:', error);
            next(error);
        }
    },
    
      async updateVendor(req, res, next) {
        try {
        const userId = req.payload.aud;
        const user = await User.findById(userId);
        if (user.role === 'Customer') {
            throw createError.Forbidden("Only admins and vendors can update stores");
        }
          const updatedVendor = await Vendor.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate('user').exec();
          if (!updatedVendor) {
            throw createError.NotFound('Vendor not found');
          }
          res.status(200).json(updatedVendor);
        } catch (error) {
          next(error);
        }
      },


      async getAllCustomers(req, res, next) {
        try {
            const customers = await Customer.find().populate('user');
            res.status(200).json({ data: customers });
        } catch (error) {
            next(error);
        }
    }
    
};

module.exports = UserController;
