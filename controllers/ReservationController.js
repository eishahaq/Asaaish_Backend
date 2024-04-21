const Reservation = require('../Models/Reservation');
const Product = require('../Models/Product');
const Inventory = require('../Models/Inventory');
const User = require('../Models/User');
const createError = require('http-errors');

const ReservationController = {
    async createReservation(req, res, next) {
        try {
            const userId = req.payload.aud; // Extract user ID from JWT payload
            const { productId, inventoryId, variant } = req.body;

            // Check if the user has exceeded the reservation limit
            const reservationCount = await Reservation.countDocuments({ userId });
            if (reservationCount >= 3) {
                return res.status(400).json({ message: "Limit of 3 active reservations exceeded." });
            }

            // Check if the product variant is already reserved by this user
            const existingReservation = await Reservation.findOne({
                userId,
                'items.productId': productId,
                'items.inventoryId': inventoryId,
                'items.variant.color': variant.color,
                'items.variant.size': variant.size
            });

            if (existingReservation) {
                return res.status(400).json({ message: "You have already reserved this product variant." });
            }

            // Validate the inventory availability for the given variant
            const inventory = await Inventory.findById(inventoryId);
            const variantInInventory = inventory.variants.find(v => 
                v.color === variant.color && v.size === variant.size);

            if (!variantInInventory || variantInInventory.quantity < 1) {
                return res.status(401).json({ message: "Insufficient stock for this variant." });
            }

            // Create the reservation
            const reservation = new Reservation({
                userId,
                items: [{
                    productId,
                    inventoryId,
                    variant
                }]
            });

            await reservation.save();
            res.status(201).json({ message: 'Reservation created successfully.', reservation });
        } catch (error) {
            console.error('Reservation Error:', error);
            next(createError.InternalServerError());
        }
    },

    async getUserReservations(req, res, next) {
        try {
            const userId = req.payload.aud; // Get user ID from JWT payload
            const reservations = await Reservation.find({ userId })
                .populate('items.productId')
                .populate('items.inventoryId');

            res.status(200).json(reservations);
        } catch (error) {
            next(createError.InternalServerError(error));
        }
    },

    async getVendorReservations(req, res, next) {
        try {
            const vendorId = req.payload.aud; // Get vendor ID from JWT payload
            const products = await Product.find({ vendor: vendorId });
            const productIds = products.map(product => product._id);

            const reservations = await Reservation.find({
                'items.productId': { $in: productIds }
            }).populate('items.productId').populate('items.inventoryId');

            res.status(200).json(reservations);
        } catch (error) {
            next(createError.InternalServerError(error));
        }
    },

    async cancelReservation(req, res, next) {
        try {
            const reservationId = req.params.reservationId;
            const reservation = await Reservation.findByIdAndDelete(reservationId);
            if (!reservation) {
                return res.status(404).json({ message: "Reservation not found." });
            }

            res.status(200).json({ message: 'Reservation cancelled successfully.' });
        } catch (error) {
            next(createError.InternalServerError(error));
        }
    }
};

module.exports = ReservationController;
