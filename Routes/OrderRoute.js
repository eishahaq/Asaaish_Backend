const express = require('express');
const router = express.Router();
const OrderController = require('../controllers/OrderController');
const { verifyAccessToken } = require('../Helpers/JwtHelper');

router.post('/create', verifyAccessToken, OrderController.createOrder);
router.get('/details', verifyAccessToken, OrderController.getOrderDetails);
router.patch('/update-item-status', verifyAccessToken, OrderController.updateOrderItemStatus);
router.get('/vendor-orders', verifyAccessToken, OrderController.getVendorOrders);  // Route for vendors to fetch their orders

module.exports = router;
