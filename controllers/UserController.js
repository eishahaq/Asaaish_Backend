const User = require('../Models/User');
const { verifyAccessToken } = require('../Helpers/JwtHelper');
const createError = require('http-errors');

const UserController = {
    async getAllUsers(req, res, next) {
        try {
            if (req.user.role !== 'Admin') {
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
            const userToUpdate = await User.findById(userId);
    
            if (!userToUpdate) {
                throw createError.NotFound("User not found");
            }
    
            if (req.user.role !== 'Admin' && req.user._id.toString() !== userToUpdate._id.toString()) {
                throw createError.Forbidden("You don't have permission to update this user");
            }
    
            const updates = req.body;
    
            // Handle password change
            if (updates.oldPassword && updates.newPassword) {
                const isMatch = await userToUpdate.isValidPassword(updates.oldPassword);
                if (!isMatch) {
                    throw createError.Unauthorized("Old password is incorrect");
                }
                const salt = await bcrypt.genSalt(10);
                updates.password = await bcrypt.hash(updates.newPassword, salt);
            }
            delete updates.oldPassword;
            delete updates.newPassword;
    
            if (req.user.role !== 'Admin') {
                delete updates.email;
                delete updates.role;
                delete updates.username;
                delete updates.status;
                delete updates.brand;
            }
    
            const updatedUser = await User.findByIdAndUpdate(userId, { $set: updates }, { new: true });
            res.status(200).json({ updated_user: updatedUser });
        } catch (err) {
            next(err);
        }
    },    

    async deleteUser(req, res, next) {
        try {
            if (req.user.role !== 'Admin') {
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
    }
};

module.exports = UserController;
