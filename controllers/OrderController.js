const mongoose = require('mongoose');
const createError = require('http-errors');
const Order = require('../Models/Order');
const Product = require('../Models/Product');
const Store = require('../Models/Store');
const Inventory = require('../Models/Inventory');
const Customer = require('../Models/Customer');


// Function to find the nearest store that has the product
async function findNearestStoreWithProduct(customerLocation, productId) {
    const inventoryItems = await Inventory.find({ productId }).populate('storeId');
    const storesWithProduct = inventoryItems.map(item => item.storeId);

    if (storesWithProduct.length === 0) return null;

    // Sort by proximity to customer location
    storesWithProduct.sort((a, b) => {
        const distanceA = getDistanceBetweenPoints(customerLocation, a.location.coordinates);
        const distanceB = getDistanceBetweenPoints(customerLocation, b.location.coordinates);
        return distanceA - distanceB;
    });

    return storesWithProduct[0];
}

// Helper function to calculate distance (you might need a more accurate method)
function getDistanceBetweenPoints(point1, point2) {
    // Simple Euclidean distance - for real applications use geospatial calculations
    return Math.sqrt(Math.pow(point1[0] - point2[0], 2) + Math.pow(point1[1] - point2[1], 2));
}

const OrderController = {
    
    async createOrder(req, res) {
       console.log(req.payload)
       if (req.payload.role !== 'Customer') {
        throw createError.Forbidden("Only customers can create orders.");
    }
    
    
        const userId = req.payload.aud; // Assuming this retrieves the user's ID
        const { items, paymentType } = req.body;
    
        try {
            let total = 0;
            const orderItems = [];
    
            for (let item of items) {
                const product = await Product.findById(item.productId);
                if (!product) {
                    throw createError(404, `Product not found: ${item.productId}`);
                }
    
                let store = await findNearestStoreWithProduct(req.payload.location, item.productId);
    
                if (!store) {
                    throw createError(404, `No nearby store found with product: ${item.productId}`);
                }
    
                const inventory = await Inventory.findOne({ productId: item.productId, storeId: store._id });
                if (!inventory || inventory.quantity < item.quantity) {
                    throw createError(400, `Insufficient inventory for product: ${item.productId} at nearest store`);
                }
    
                const price = product.price * item.quantity;
                total += price;
    
                orderItems.push({
                    productId: item.productId,
                    storeId: store._id,
                    quantity: item.quantity,
                    price: price
                });
            }
    
            const newOrder = new Order({
                userId: userId,
                items: orderItems,
                total: total,
                status: 'pending',
                paymentType: paymentType,
                orderDate: new Date(),
                deliveryAddress: req.payload.address // Assuming the address comes from the payload
            });
    
            await newOrder.save();
    
            res.status(201).json({ message: "Order created successfully", orderId: newOrder._id, orderNumber: newOrder.orderNumber });
        } catch (error) {
            res.status(error.status || 500).json({ message: error.message });
        }
    },
    
    async getAllOrders(req, res) {
        try {
            const orders = await Order.find({}).populate('userId items.productId items.storeId');
            res.status(200).json(orders);
        } catch (error) {
            res.status(error.status || 500).json({ message: error.message });
        }
    },

    async getOrdersByStore(req, res) {
        const storeId = req.params.storeId; // Assuming store ID is passed as a URL parameter

        try {
            if (!mongoose.Types.ObjectId.isValid(storeId)) {
                throw createError(400, "Invalid store ID");
            }

            const orders = await Order.find({ 'items.storeId': storeId }).populate('userId items.productId');
            res.status(200).json(orders);
        } catch (error) {
            res.status(error.status || 500).json({ message: error.message });
        }
    },

};

module.exports = OrderController;
