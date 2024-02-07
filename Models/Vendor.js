<<<<<<< HEAD
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const VendorSchema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    brand: { type: Schema.Types.ObjectId, ref: 'Brand', required: true }, // Reference to Brand
    stores: [{ type: Schema.Types.ObjectId, ref: 'Store' }], // References to stores this vendor manages
}, { timestamps: true });

const Vendor = mongoose.model('Vendor', VendorSchema);
module.exports = Vendor;
=======
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
>>>>>>> 0b1847d2d255b4aa7477c63be969714165fecbc5
