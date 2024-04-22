const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CartItemSchema = new Schema({
  productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  inventoryId: { type: Schema.Types.ObjectId, ref: 'Inventory', required: true },
  quantity: { type: Number, required: true, min: 1 },
  variant: {
    color: String,
    size: String
  }
});

const CartSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  items: [CartItemSchema]
});

const Cart = mongoose.model('Cart', CartSchema);
module.exports = Cart;
