const mongoose = require('mongoose')
const Schema = mongoose.Schema 

const AdminSchema = new Schema({

    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

})

const admin = mongoose.model('Admin', AdminSchema)
module.exports = admin