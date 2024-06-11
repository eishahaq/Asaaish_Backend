const express = require('express');
const router = express.Router();
const OrderController = require('../controllers/OrderController');
const { verifyAccessToken } = require('../Helpers/JwtHelper');

router.post('/create', verifyAccessToken, OrderController.createOrder);

router.get('/details', verifyAccessToken, OrderController.getOrderDetails);

router.patch('/update-item-status/:orderId/:itemId/status', verifyAccessToken, OrderController.updateOrderItemStatus);

router.get('/orders', OrderController.getAllOrders);

router.put('/:orderId', OrderController.updateOrder);

router.get('/vendor-orders', verifyAccessToken, OrderController.getVendorOrders);

router.delete('/deleteorder/:orderId', verifyAccessToken, OrderController.deleteOrder);

module.exports = router;
