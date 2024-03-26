const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose); // Import mongoose-sequence
const Schema = mongoose.Schema;

const OrderSchema = new Schema({
    orderNumber: { type: Number }, // Field for the order number
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    items: [{
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
        quantity: Number,
        price: Number
    }],
    total: Number,
    status: {
        type: String,
        enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
        default: 'pending'
    },
    paymentType: {
        type: String,
        enum: ['COD', 'Card'],
        required: true
    },
    orderDate: { 
        type: Date, 
        default: Date.now 
    }
}, { timestamps: true });

// Apply the auto-increment plugin to OrderSchema
OrderSchema.plugin(AutoIncrement, {inc_field: 'orderNumber'});

const Order = mongoose.model('Order', OrderSchema);
module.exports = Order;
