const Order = require('../Models/Order');
const Product = require('../Models/Product');
const Brand = require('../Models/Brand');
const Vendor = require('../Models/Vendor');
const Inventory = require('../Models/Inventory');

const Store = require('../Models/Store');
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

    async deleteOrder(req, res) {
        const { orderId } = req.params;
        try {
            const order = await Order.findByIdAndDelete(orderId);
            if (!order) {
                return res.status(404).json({ message: 'Order not found' });
            }
    
            res.status(200).json({ message: 'Order deleted successfully' });
        } catch (error) {
            console.error('Failed to delete order:', error);
            res.status(500).json({ message: 'Internal server error', error });
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


    async getAllOrders(req, res) {
        try {
            const orders = await Order.find()
                .populate({
                    path: 'items.productId',
                    populate: { path: 'brandId' }
                })
                .populate('userId');

            res.status(200).json(orders);
        } catch (error) {
            console.error('Error fetching all orders:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    },

    async updateOrder(req, res) {
        try {
            const { orderId } = req.params;
            const updateData = req.body;
            const order = await Order.findByIdAndUpdate(orderId, updateData, { new: true });

            if (!order) {
                return res.status(404).json({ message: 'Order not found' });
            }

            res.status(200).json({ message: 'Order updated successfully', order });
        } catch (error) {
            console.error('Error updating order:', error);
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
    
    async getVendorOrders(req, res, next) {
        try {
            const vendorId = req.payload.aud;
            console.log('Vendor ID from token:', vendorId);
    
            // Find the vendor based on the user ID
            const vendor = await Vendor.findOne({ user: vendorId }).exec();
            if (!vendor) {
                console.log('Vendor not found for user ID:', vendorId);
                return res.status(404).json({ message: "Vendor not found" });
            }
    
            console.log('Vendor found:', vendor);
    
            // Get the store IDs associated with the vendor
            const storeIds = vendor.stores;
            console.log('Store IDs associated with vendor:', storeIds);
    
            // Find all inventories related to these stores
            const inventories = await Inventory.find({ storeId: { $in: storeIds } }).exec();
            console.log('Inventories found:', inventories);
    
            // Extract the inventory IDs
            const inventoryIds = inventories.map(inventory => inventory._id);
            console.log('Inventory IDs:', inventoryIds);
    
            if (inventoryIds.length === 0) {
                console.log('No inventory IDs found for the vendor stores.');
                return res.status(404).json({ message: "No inventory found for vendor stores" });
            }
    
            // Find orders that contain items with these inventory IDs
            const orders = await Order.find({
                'items.inventoryId': { $in: inventoryIds }
            }).populate({
                path: 'items.productId',
                populate: { path: 'brandId' }
            }).populate('items.inventoryId');
    
            console.log('Orders found:', orders);
    
            if (orders.length === 0) {
                console.log('No orders found for the given inventory IDs.');
            }
    
            res.status(200).json(orders);
        } catch (error) {
            console.error('Error fetching orders for vendor:', error);
            next(createError.InternalServerError(error));
        }
    }
    
    
    
};

module.exports = OrderController;
