const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const OrderItemSchema = new Schema({
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    inventoryId: { type: Schema.Types.ObjectId, ref: 'Inventory', required: true },
    quantity: { type: Number, required: true },
    variant: {
        color: String,
        size: String
    },
    price: { type: Number, required: true },
    status: { type: String, default: 'Pending', enum: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'] }  // Individual item status
});

const OrderSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    items: [OrderItemSchema],
    total: { type: Number, required: true },
    paymentMethod: { type: String, required: true },
    shippingDetails: {
        firstName: String,
        lastName: String,
        phone: String,
        address: String,
        city: String,
        country: String,
        zipCode: String
    },
    deliveryLocation: {
        type: { type: String, enum: ['Point'], default: 'Point' },
        coordinates: { type: [Number], required: true }  
    },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Order', OrderSchema);