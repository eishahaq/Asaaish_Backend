const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ReservationItemSchema = new Schema({
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    inventoryId: { type: Schema.Types.ObjectId, ref: 'Inventory', required: true },
    variant: {
        color: { type: String, required: true },
        size: { type: String, required: true },
    },
    reservedAt: { type: Date, default: Date.now },
    status: {
        type: String,
        enum: ['Active', 'Cancelled by User', 'Cancelled by Vendor'],
        default: 'Active'
    }
});

const ReservationSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    items: [ReservationItemSchema],
    expiresAt: { type: Date, default: () => new Date(+new Date() + 24*60*60*1000) }
});

const Reservation = mongoose.model('Reservation', ReservationSchema);
module.exports = Reservation;
