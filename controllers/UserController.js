const User = require('../Models/User');
const { verifyAccessToken } = require('../Helpers/JwtHelper');

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
    }
};

module.exports = UserController;
