const User = require('../Models/User');
const { verifyAccessToken } = require('../Helpers/JwtHelper');
const Vendor = require('../Models/Vendor');

const UserController = {
    async getAllUsers(req, res, next) {
        try {
            const users = await User.find();
            res.status(200).json({ data: users });
        } catch (err) {
            next(err);
        }
    },

    async getUserById(req, res, next) {
        try {
            const user = await User.findById(req.payload.aud);
            const users = await User.find({ user_id: user.user_id });
            res.status(200).json({ Users: users });
        } catch (err) {
            next(err);
        }
    },

    async deleteUser(req, res, next) {
        try {
            const result = await User.findOneAndUpdate(
                { _id: req.params.id },
                { $set: { status: "INACTIVE" } }
            );
            res.status(200).json({ updated_user: result, message: "User has been removed" });
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
          const userId = req.payload.aud; // Assuming the user ID is stored in the JWT token's audience (aud) field
          console.log('User ID:', userId);
          const vendor = await Vendor.findOne({ user: userId }).populate('user').populate('brand').populate('stores');

          if (!vendor) {
            throw createError.NotFound('Vendor not found');
          }
          res.status(200).json(vendor);
        } catch (error) {
          next(error);
        }
      },
    
      // Update vendor details
      async updateVendor(req, res, next) {
        try {
          const userId = req.payload.aud;
          const { brand, stores } = req.body; // Assuming you want to update the brand and stores
          const updatedVendor = await Vendor.findOneAndUpdate({ user: userId }, { brand, stores }, { new: true }).populate('user').populate('brand').populate('stores');
          if (!updatedVendor) {
            throw createError.NotFound('Vendor not found');
          }
          res.status(200).json(updatedVendor);
        } catch (error) {
          next(error);
        }
      },
    


};

module.exports = UserController;
