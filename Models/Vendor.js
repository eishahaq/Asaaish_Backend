const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const VendorSchema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    brand: { type: Schema.Types.ObjectId, ref: 'Brand', required: true }, 
    stores: [{ type: Schema.Types.ObjectId, ref: 'Store' }], 
}, { timestamps: true });

const Vendor = mongoose.model('Vendor', VendorSchema);
module.exports = Vendor;
