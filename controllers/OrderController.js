// File: controllers/OrderController.js
const Order = require('../models/Order');
const Product = require('../models/Product');
const Brand = require('../Models/Brand');
const Vendor = require('../Models/Vendor');
const createError = require('http-errors');
const transporter = require('../config/mailConfig')
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

            const emailContent = `
                <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.5; font-size: 16px; color: #333; }
                        h1 { color: #0056b3; }
                        ul { list-style-type: none; padding: 0; }
                        li { margin: 5px 0; }
                        .total { font-size: 18px; font-weight: bold; color: #ff4500; }
                        .container { background-color: #f9f9f9; padding: 20px; border-radius: 8px; border: 1px solid #ddd; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <h1>Thank you for your order!</h1>
                        <p>Your order has been placed successfully and will be processed shortly.</p>
                        <h2>Order Details:</h2>
                        <p class="total">Total: $${total}</p>
                        <h3>Items Ordered:</h3>
                        <ul>
                            ${items.map(item => `
                                <li>
                                    ${item.quantity} x ${item.productName} (Size: ${item.variant.size}, Color: ${item.variant.color}) - $${item.price.toFixed(2)} each
                                </li>
                            `).join('')}
                        </ul>
                        <h3>Shipping Details:</h3>
                        <p>${shippingDetails.firstName} ${shippingDetails.lastName}</p>
                        <p>${shippingDetails.address}, ${shippingDetails.city}, ${shippingDetails.zipCode}, ${shippingDetails.country}</p>
                    </div>
                </body>
                </html>
            `;

        await transporter.sendMail({
          from: 'jazil10@hotmail.com', 
          to: 'zinneerahrafiq10@gmail.com', 
          subject: 'Order Confirmation',
          html: emailContent
      });

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
