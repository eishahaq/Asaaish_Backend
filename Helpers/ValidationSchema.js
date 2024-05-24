const Joi = require('@hapi/joi');

const authorizationSchema = Joi.object({
    role: Joi.string().valid('Customer', 'Vendor', 'Admin'),
    email: Joi.string().email(),
    username: Joi.string(),
    firstname: Joi.string(),
    lastname: Joi.string(),
    password: Joi.string(),
    brand: Joi.string(),
    stores: Joi.string(),
    address: Joi.string(),
    location: Joi.object({
        type: Joi.string().valid('Point'),
        coordinates: Joi.array().items(Joi.number()).length(2)
    }),
    status: Joi.string().valid('ACTIVE', 'INACTIVE')
});

module.exports = {
    authorizationSchema,
};
