const Joi = require('@hapi/joi')

const authorizationSchema =Joi.object({
    role: Joi.string().valid('Customer', 'Vendor', 'Admin'),
    email: Joi.string().email(),
    username: Joi.string(),
    firstname: Joi.string(),
    lastname: Joi.string(),
    password: Joi.string(),
    brand_name: Joi.string(),
    branch_code: Joi.string(),
   // location: Joi.array().items(Joi.number()),
    address: Joi.string()
})

module.exports = {
    authorizationSchema,
}