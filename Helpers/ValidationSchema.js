const Joi = require('@hapi/joi');

const authorizationSchema = Joi.object({
    role: Joi.string().valid('Customer', 'Vendor', 'Admin').required(),
    email: Joi.string().email().required(),
    username: Joi.string().required(),
    firstname: Joi.string().required(),
    lastname: Joi.string().required(),
    password: Joi.string().required(),
    brand: Joi.string().pattern(new RegExp('^[0-9a-fA-F]{24}$')).when('role', { is: 'Vendor', then: Joi.required() }),
    stores: Joi.array().items(Joi.string().pattern(new RegExp('^[0-9a-fA-F]{24}$'))).when('role', { is: 'Vendor', then: Joi.required() }),
});

module.exports = {
    authorizationSchema,
};
