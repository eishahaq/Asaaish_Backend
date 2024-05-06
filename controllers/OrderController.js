// File: controllers/OrderController.js
const Order = require('../models/Order');
const Product = require('../models/Product');
const Brand = require('../models/Brand');
const Vendor = require('../models/Vendor');
const createError = require('http-errors');

const OrderController = {
    async createOrder(req, res) {
        try {
            const userId = req.payload.aud;
            const { items, total, paymentMethod, shippingDetails, deliveryLocation } = req.body;
            const order = new Order({
                userId,
                items,
                total,
                paymentMethod,
                shippingDetails,
                deliveryLocation
            });

            await order.save();
            res.status(201).json({ message: 'Order created successfully', order });
        } catch (error) {
            console.error('Order Creation Error:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    },

    async getOrderDetails(req, res) {
        try {
            const userId = req.payload.aud;
            const orders = await Order.find({ userId }).populate('items.productId');
            res.status(200).json(orders);
        } catch (error) {
            console.error('Error fetching order details:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    },

    async updateOrderItemStatus(req, res) {
        try {
            const { orderId, itemId, status } = req.body;
            const order = await Order.findOneAndUpdate(
                { "_id": orderId, "items._id": itemId },
                { "$set": { "items.$.status": status } },
                { new: true }
            );

            if (!order) {
                return res.status(404).json({ message: "Order item not found." });
            }
            res.status(200).json({ message: 'Order item status updated successfully', order });
        } catch (error) {
            console.error('Error updating order item status:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    },

    async getVendorOrders(req, res) {
        try {
            const vendorId = req.payload.aud;  
            console.log(vendorId);
            // Fetch the vendor to get associated brands
            const vendor = await Vendor.findOne({ user: vendorId }).populate('brand');
            console.log(vendor);
            if (!vendor) {
                return res.status(404).json({ message: 'Vendor not found.' });
            }
    
            console.log('Brands associated with vendor:', vendor.brand);
    
            // Fetch products linked to these brands
            const products = await Product.find({ brandId: { $in: vendor.brandy } }).select('_id');
            console.log('Products found:', products);
    
            if (products.length === 0) {
                return res.status(404).json({ message: 'No products linked to vendor brands found.' });
            }
    
            const productIds = products.map(product => product._id);
    
            // Fetch orders containing these products
            const orders = await Order.find({
                'items.productId': { $in: productIds }
            }).populate({
                path: 'items.productId',
                populate: { path: 'brandId' }
            });
    
            console.log('Orders found:', orders);
            res.status(200).json(orders);
        } catch (error) {
            console.error('Error fetching orders for vendor:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }
    
    
};

module.exports = OrderController;
