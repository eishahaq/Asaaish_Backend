const User = require('../Models/User');
const Customer = require('../Models/Customer');
const Vendor = require('../Models/Vendor');
const mongoose = require('mongoose');
const createError = require('http-errors');
const { authorizationSchema } = require('../Helpers/ValidationSchema');
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require('../Helpers/JwtHelper');

const AuthenticationController = {
    async signup(req, res, next) {
        try {
            console.log(req.body);
            const result = await authorizationSchema.validateAsync(req.body);
            const doesExist = await User.findOne({ email: result.email });
            if (doesExist) throw createError.Conflict(`${result.email} has already been registered`);

            console.log('Creating user...');
            const user = new User({
                _id: new mongoose.Types.ObjectId(),
                username: result.username,
                firstname: result.firstname,
                lastname: result.lastname,
                role: result.role,
                status: "ACTIVE",
                password: result.password,
                email: result.email
            });

            const savedUser = await user.save();
            console.log('User created:', savedUser);

            if (result.role === 'Customer') {
                console.log('Creating customer...');
                const locationCoordinates = result.location.coordinates;
                if (!locationCoordinates || !Array.isArray(locationCoordinates) || locationCoordinates.length !== 2) {
                    throw createError.BadRequest('Invalid location coordinates');
                }

                const customer = new Customer({
                    user: savedUser._id,
                    location: {
                        type: 'Point',
                        coordinates: locationCoordinates
                    },
                    address: result.address || ''
                });

                const savedCustomer = await customer.save();
                console.log('Customer created:', savedCustomer);

                
            }  else if (result.role === 'Vendor') {
                console.log('Creating vendor...');
                const vendor = new Vendor({
                    user: savedUser._id,
                    brand: result.brand, 
                    stores: result.stores, 
                });

                const savedVendor = await vendor.save();
                console.log('Vendor created:', savedVendor);
            }

            const accessToken = await signAccessToken(savedUser.id);
            const refreshToken = await signRefreshToken(savedUser.id);
            res.send({ accessToken, refreshToken });
        } 
        catch (error) {
            if (error.isJoi === true) error.status = 422;
            console.error('Joi validation error:', error.details);
            next(error);
        }
    },

    async login(req, res, next) {
        try {
            const result = await authorizationSchema.validateAsync(req.body);
            const user = await User.findOne({ email: result.email });

            if (!user) throw createError.NotFound('User is not registered');
            if (user.status === "INACTIVE") throw createError.NotFound('User has been deleted');

            const isMatch = await user.isValidPassword(result.password);
            if (!isMatch) throw createError.Unauthorized('Username/password not valid');

            const accessToken = await signAccessToken(user.id);
            const refreshToken = await signRefreshToken(user.id);

            res.send({ accessToken, refreshToken });
        } catch (error) {
            if (error.isJoi === true)
                return next(createError.BadRequest("Invalid email/Password"));
            next(error);
        }
    },

    async refreshToken(req, res, next) {
        try {
            const { refreshToken } = req.body;
            if (!refreshToken) throw createError.BadRequest();
            const userId = await verifyRefreshToken(refreshToken);

            const accessToken = await signAccessToken(userId);
            const newRefreshToken = await signRefreshToken(userId);
            res.send({ accessToken, refreshToken: newRefreshToken });
        } catch (error) {
            next(error);
        }
    }
};

module.exports = AuthenticationController;
