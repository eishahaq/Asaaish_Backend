const express = require('express');
const router = express.Router();
const OrderController = require('../controllers/OrderController');
const { verifyAccessToken } = require('../Helpers/JwtHelper');

router.post('/create', verifyAccessToken, OrderController.createOrder);

router.get('/details', verifyAccessToken, OrderController.getOrderDetails);

router.patch('/update-item-status', verifyAccessToken, OrderController.updateOrderItemStatus);

router.get('/orders', OrderController.getAllOrders);

router.get('/vendor-orders', verifyAccessToken, OrderController.getVendorOrders);

module.exports = router;
