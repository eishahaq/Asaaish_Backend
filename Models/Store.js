const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const StoreSchema = new Schema({
    brand: {
        type: Schema.Types.ObjectId,
        ref: 'Brand',
        required: true
    },
    name: {
        type: String,
        required: true
    },
    address: String,
    contactInfo: String,
    location: {
        type: { type: String, enum: ['Point'], default: 'Point' },
        coordinates: {
            type: [Number],
            index: '2dsphere'
        }
    }
}, { timestamps: true });

const Store = mongoose.model('Store', StoreSchema);
module.exports = Store;
