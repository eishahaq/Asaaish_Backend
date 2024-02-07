const mongoose = require('mongoose')
const Schema = mongoose.Schema 

const VendorSchema = new Schema({

    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    brand_name: {
        type: String,
        required: true
    },
})

const vendor = mongoose.model('Vendor', VendorSchema);
module.exports = vendor;