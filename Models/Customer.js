const mongoose = require('mongoose')
const Schema = mongoose.Schema 

const CustomerSchema = new Schema({

    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

})


const customer = mongoose.model('Customer', CustomerSchema)
module.exports = customer