const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const VendorSchema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    brand: { type: Schema.Types.ObjectId, ref: 'Brand', required: true }, // Reference to Brand
    stores: [{ type: Schema.Types.ObjectId, ref: 'Store' }], // References to stores this vendor manages
}, { timestamps: true });

const Vendor = mongoose.model('Vendor', VendorSchema);
module.exports = Vendor;
