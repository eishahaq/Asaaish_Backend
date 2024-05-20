const Joi = require('@hapi/joi');

const authorizationSchema = Joi.object({
    role: Joi.string().valid('Customer', 'Vendor', 'Admin'),
    email: Joi.string().email(),
    username: Joi.string(),
    firstname: Joi.string(),
    lastname: Joi.string(),
    password: Joi.string(),
    brand: Joi.string(),  // Added brand field
    stores: Joi.array(),  // Added stores field (add item validation if necessary)
    address: Joi.string(), // Assuming this is still needed; if not, remove it
    location: {  // Correctly nesting the location schema
    type: Joi.string().valid('Point').required(),
    coordinates: Joi.array().items(Joi.number()).length(2).required()
    },
    status: Joi.string().valid('ACTIVE', 'INACTIVE')

});

module.exports = {
    authorizationSchema,
};
