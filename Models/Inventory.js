const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const inventorySchema = new Schema({
    inventoryID: {
        type: mongoose.Schema.Types.ObjectId, // Unique identifier for the inventory record
        required: true,
        unique: true
    },
    storeId: {
        type: Schema.Types.ObjectId,
        ref: 'Store',
        required: true
      },
    productID: {
        type: String, // Reference to the Product schema
        required: true,
        ref: 'Product'
    },
    quantityAvailable: {
        type: Number,
        required: true,
        min: 0 // Ensuring quantity is not negative
    },
    quantitySold: {
        type: Number,
        default: 0, // Default value when a new record is created
        min: 0
    },
    restockLevel: {
        type: Number,
        required: true,
        min: 0
    },
    lastRestockDate: {
        type: Date,
        default: Date.now // Default to the current date
    },
    variants: [
        {
          color: String,
          size: String,
          quantity: {
         type: Number,
            required: true
          }
        }
      ]
});

const Inventory = mongoose.model('Inventory', inventorySchema);

module.exports = Inventory;

//variants array, color price quantity

