const Joi = require('@hapi/joi')

const authorizationSchema =Joi.object({
    role: Joi.string().valid('Customer', 'Vendor', 'Admin'),
    email: Joi.string().email(),
    username: Joi.string(),
    firstname: Joi.string(),
    lastname: Joi.string(),
    password: Joi.string(),
    brand: Joi.string(), 
    stores: Joi.array().items(Joi.string()).default([]),
})

module.exports = {
    authorizationSchema,
}