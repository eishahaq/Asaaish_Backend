// File: controllers/OrderController.js
const Order = require('../Models/Order');
const Cart = require('../Models/Cart');
const createError = require('http-errors');
const mongoose = require('mongoose');

const OrderController = {
    async checkout(req, res, next) {
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            const userId = req.payload.aud;
            const {
              paymentMethod, deliveryLocation, shippingDetails
            } = req.body;
            const cart = await Cart.findOne({ userId });
            if (!cart || cart.items.length === 0) throw createError.BadRequest('Cart is empty');

            let total = 0;
            // Validation and inventory updates as previously discussed

            // Incorporate shipping and customer contact details into the order
            const order = await Order.create([{
                userId,
                items: cart.items,
                total,
                paymentMethod,
                shippingDetails,
                deliveryLocation: {
                  type: 'Point',
                  coordinates: deliveryLocation // [longitude, latitude]
                },
                status: 'Pending'
            }], { session });

            // Clear the cart
            cart.items = [];
            await cart.save({ session });

            await session.commitTransaction();
            session.endSession();

            res.status(201).json(order);
        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            next(error);
        }
    },
    
    async getUserOrders(req, res, next) {
        try {
            const userId = req.payload.aud;
            const orders = await Order.find({ userId }).sort({ createdAt: -1 });
            res.status(200).json(orders);
        } catch (error) {
            next(error);
        }
    },

    // Get details of a specific order
    async getOrderDetails(req, res, next) {
        try {
            const userId = req.payload.aud;
            const { orderId } = req.params;
            const order = await Order.findOne({ _id: orderId, userId });
            if (!order) throw createError.NotFound('Order not found');
            res.status(200).json(order);
        } catch (error) {
            next(error);
        }
    },

    // Update an existing order (e.g., update status or shipping details)
    async updateOrder(req, res, next) {
        try {
            const userId = req.payload.aud;
            const { orderId } = req.params;
            const update = req.body; // This should be validated to ensure only allowable fields are updated.

            const order = await Order.findOneAndUpdate({ _id: orderId, userId }, update, { new: true });
            if (!order) throw createError.NotFound('Order not found');
            res.status(200).json(order);
        } catch (error) {
            next(error);
        }
    },

    // Delete an order (if applicable to your business logic)
    async deleteOrder(req, res, next) {
        try {
            const userId = req.payload.aud;
            const { orderId } = req.params;
            const result = await Order.deleteOne({ _id: orderId, userId });
            if (result.deletedCount === 0) throw createError.NotFound('Order not found or user mismatch');
            res.status(200).json({ message: 'Order deleted successfully' });
        } catch (error) {
            next(error);
        }
    }
};

module.exports = OrderController;