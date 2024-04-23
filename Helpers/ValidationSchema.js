const Joi = require('@hapi/joi');

const authorizationSchema = Joi.object({
    role: Joi.string().valid('Customer', 'Vendor', 'Admin'),
    email: Joi.string().email(),
    username: Joi.string(),
    firstname: Joi.string(),
    lastname: Joi.string(),
    password: Joi.string(),
    brandId: Joi.string(),  // Added brand field
    stores: Joi.array(),  // Added stores field (add item validation if necessary)
    address: Joi.string() // Assuming this is still needed; if not, remove it
});

module.exports = {
    authorizationSchema,
};
