const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ReservationItemSchema = new Schema({
    productId: {
        type: Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    inventoryId: {
        type: Schema.Types.ObjectId,
        ref: 'Inventory',
        required: true
    },
    variant: {
        color: String,
        size: String,
    },
    reservedAt: {
        type: Date,
        default: Date.now
    }
});

const ReservationSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    items: [ReservationItemSchema],
    expiresAt: {
        type: Date,
        default: () => new Date(+new Date() + 24*60*60*1000),
        index: { expires: '24h' }
    }
});

const Reservation = mongoose.model('Reservation', ReservationSchema);
module.exports = Reservation;
