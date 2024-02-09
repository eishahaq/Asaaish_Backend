const mongoose = require('mongoose')
const Schema = mongoose.Schema 

const InventorySchema = new Schema({
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    storeId: {
      type: Schema.Types.ObjectId,
      ref: 'Store',
      required: true
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
    ],
    offers: {
      discountPercentage: Number,
      description: String,
      validUntil: Date
    }
  });
  
  const Inventory = mongoose.model('Inventory', InventorySchema);
  module.exports = Inventory;
  
