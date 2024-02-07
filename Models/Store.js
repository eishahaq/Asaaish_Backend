const mongoose = require('mongoose');

const storeSchema = new mongoose.Schema({
    storeID: {
        type: mongoose.Schema.Types.ObjectId, // Unique identifier
        required: true
    },
    brandID: {
        type: mongoose.Schema.Types.ObjectId, // Reference to Brand schema
        required: true,
        ref: 'Brand'
    },
    vendorID: {
        type: mongoose.Schema.Types.ObjectId, // Reference to Vendor schema
        required: true,
        ref: 'Vendor'
    },
    branchName: { // Added branch name field
        type: String,
        required: true
    },
    location: {
        type: { type: String, enum: ['Point'], default: 'Point' },
        coordinates: {
          type: [Number], // Format: [longitude, latitude]
          index: '2dsphere'
        }
      },
    address: {
        type: String
    },
    contactInfo: {
        phone: String,
        email: String,
    },
    inventory: [{
        type: mongoose.Schema.Types.ObjectId, // Reference to Inventory schema
        ref: 'Inventory'
    }]
});

const Store = mongoose.model('Store', storeSchema);

module.exports = Store;

//location array taking coordinates
  
