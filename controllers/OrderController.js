const Order = require('../Models/Order');
const createError = require('http-errors');

const OrderController = {
  async createOrder(req, res, next) {
    const userId = req.payload.aud;
    const { items, total, paymentMethod, shippingDetails, deliveryLocation } = req.body;

    try {
      const order = new Order({
        userId,
        items,
        total,
        paymentMethod,
        shippingDetails,
        deliveryLocation,
        status: 'Pending'
      });
      await order.save();
      res.status(201).json({ message: 'Order created successfully', order });
    } catch (error) {
      console.error('Order Creation Error:', error);
      next(createError.InternalServerError());
    }
  },

  async getUserOrders(req, res, next) {
    const userId = req.payload.aud;
    try {
      const orders = await Order.find({ userId });
      res.status(200).json(orders);
    } catch (error) {
      console.error('Error fetching user orders:', error);
      next(createError.InternalServerError());
    }
  },

  async updateOrderStatus(req, res, next) {
    const { orderId, status } = req.body;
    try {
      const updatedOrder = await Order.findByIdAndUpdate(orderId, { status }, { new: true });
      if (!updatedOrder) {
        return res.status(404).json({ message: "Order not found." });
      }
      res.status(200).json({ message: 'Order updated successfully', updatedOrder });
    } catch (error) {
      console.error('Error updating order status:', error);
      next(createError.InternalServerError());
    }
  },

  async deleteOrder(req, res, next) {
    const orderId = req.params.id;
    try {
      const deletedOrder = await Order.findByIdAndDelete(orderId);
      if (!deletedOrder) {
        return res.status(404).json({ message: "Order not found." });
      }
      res.status(200).json({ message: 'Order deleted successfully.' });
    } catch (error) {
      console.error('Error deleting order:', error);
      next(createError.InternalServerError());
    }
  }
};

module.exports = OrderController;
