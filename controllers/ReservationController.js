const Reservation = require('../Models/Reservation');
const createError = require('http-errors');

const ReservationController = {
    async createReservation(req, res) {
        const { productId, storeId } = req.body;
        const userId = req.payload.aud; // Assuming this retrieves the user's ID
        try {
            // Check for existing active reservation of the same product by the user
            const existingReservation = await Reservation.findOne({
                userId,
                productId,
                expiresAt: { $gte: new Date() }
            });

            if (existingReservation) {
                throw createError(400, "You already have an active reservation for this product");
            }

            const reservation = new Reservation({ productId, storeId, userId });
            await reservation.save();

            res.status(201).json({ message: "Reservation created successfully", reservationId: reservation._id });
        } catch (error) {
            res.status(error.status || 500).json({ message: error.message });
        }
    },

    async cancelReservation(req, res) {
        const { reservationId } = req.body;
        const userId = req.user._id;

        try {
            const reservation = await Reservation.findOneAndDelete({
                _id: reservationId,
                userId,
                expiresAt: { $gte: new Date() } // Only allow canceling active reservations
            });

            if (!reservation) {
                throw createError(404, "Reservation not found or already expired");
            }

            res.status(200).json({ message: "Reservation canceled successfully" });
        } catch (error) {
            res.status(error.status || 500).json({ message: error.message });
        }
    },

};

module.exports = ReservationController;
