const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ReservationSchema = new Schema({
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
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    reservedAt: {
        type: Date,
        default: Date.now
    },
    expiresAt: {
        type: Date,
        default: () => new Date(+new Date() + 24*60*60*1000) // 24 hours from now
    },
    status: {
        type: String,
        enum: ['reserved', 'purchased', 'cancelled'],
        default: 'reserved'
    }
});

const Reservation = mongoose.model('Reservation', ReservationSchema);
module.exports = Reservation;
