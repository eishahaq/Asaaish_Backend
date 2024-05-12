const Reservation = require('../Models/Reservation');
const createError = require('http-errors');

const ReservationController = {
    async createReservation(req, res, next) {
        const userId = req.payload.aud; // Assuming the user ID is extracted from JWT payload
        const { productId, inventoryId, variant } = req.body;

        try {
            // Check for existing active reservation
            const existingReservation = await Reservation.findOne({
                userId,
                'items.productId': productId,
                'items.inventoryId': inventoryId,
                'items.variant.color': variant.color,
                'items.variant.size': variant.size,
                'items.status': 'Active'
            });

            if (existingReservation) {
                return res.status(400).json({ message: "You have already reserved this product variant." });
            }

            // Create new reservation
            const newReservation = new Reservation({
                userId,
                items: [{ productId, inventoryId, variant, status: 'Active' }]
            });
            await newReservation.save();

            res.status(201).json({ message: 'Reservation created successfully.', reservation: newReservation });
        } catch (error) {
            console.error('Reservation Error:', error);
            next(createError.InternalServerError());
        }
    },

    async cancelReservationByUser(req, res, next) {
        const userId = req.payload.aud; // User ID from JWT payload
        const reservationId = req.params.id;
    
        try {
            // Ensure the reservation belongs to the user and update
            const updatedReservation = await Reservation.findOneAndUpdate({
                _id: reservationId,
                userId: userId, // Ensure the reservation belongs to the user
                'items.status': 'Active' // Only target active reservations
            }, {
                $set: { 'items.$[elem].status': 'Cancelled by User' }
            }, {
                arrayFilters: [{ 'elem.status': 'Active' }], // Target only elements that are active
                new: true
            });
    
            if (!updatedReservation) {
                return res.status(404).json({ message: "Reservation not found or not eligible for cancellation." });
            }
    
            res.status(200).json({ message: 'Reservation cancelled by user successfully.', reservation: updatedReservation });
        } catch (error) {
            console.error('Error canceling reservation:', error);
            next(createError.InternalServerError());
        }
    },
    

    async cancelReservationByVendor(req, res, next) {
        const reservationId = req.params.id;
        try {
            // Update reservation status to 'Cancelled by Vendor'
            const updatedReservation = await Reservation.findByIdAndUpdate(reservationId, {
                $set: { 'items.$.status': 'Cancelled by Vendor' }
            }, { new: true });

            if (!updatedReservation) {
                return res.status(404).json({ message: "Reservation not found." });
            }
            res.status(200).json({ message: 'Reservation cancelled by vendor successfully.', reservation: updatedReservation });
        } catch (error) {
            next(createError.InternalServerError());
        }
    },
   
    async getUserReservations(req, res, next) {
        try {
            const userId = req.payload.aud; // User ID from JWT payload
            // Fetch only reservations with at least one item marked as 'Active'
            const reservations = await Reservation.find({
                userId,
                'items.status': 'Active'
            })
            .populate('items.productId')
            .populate('items.inventoryId');
    
            res.status(200).json(reservations);
        } catch (error) {
            console.error('Error fetching active reservations:', error);
            next(createError.InternalServerError(error));
        }
    },

    async getAllUserReservations(req, res, next) {
        try {
            const userId = req.payload.aud; // User ID from JWT payload
            // Fetch all reservations for the user
            const reservations = await Reservation.find({ userId })
                .populate('items.productId')
                .populate('items.inventoryId');
    
            res.status(200).json(reservations);
        } catch (error) {
            console.error('Error fetching all user reservations:', error);
            next(createError.InternalServerError(error));
        }
    },
    
    

    async getVendorReservations(req, res, next) {
        try {
            const vendorId = req.payload.aud;
            const reservations = await Reservation.find({
                'items.vendorId': vendorId
            }).populate('items.productId').populate('items.inventoryId');
            res.status(200).json(reservations);
        } catch (error) {
            next(createError.InternalServerError(error));
        }
    },

    // async cancelReservation(req, res, next) {
    //     try {
    //         const reservationId = req.params.id;
    //         const updatedReservation = await Reservation.findByIdAndUpdate(reservationId, {
    //             $set: { 'items.$.status': 'Cancelled by User' }
    //         }, { new: true });
    //         if (!updatedReservation) {
    //             return res.status(404).json({ message: "Reservation not found." });
    //         }
    //         res.status(200).json({ message: 'Reservation cancelled successfully.', reservation: updatedReservation });
    //     } catch (error) {
    //         next(createError.InternalServerError(error));
    //     }
    // },

    async deleteReservation(req, res, next) {
        try {
            const reservationId = req.params.id;
            const deletedReservation = await Reservation.findByIdAndUpdate(reservationId, {
                $set: { 'items.$.status': 'Deleted' }
            }, { new: true });
            if (!deletedReservation) {
                return res.status(404).json({ message: "Reservation not found." });
            }
            res.status(200).json({ message: 'Reservation deleted successfully.' });
        } catch (error) {
            next(createError.InternalServerError(error));
        }
    },
};

module.exports = ReservationController;
