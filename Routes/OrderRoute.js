const express = require('express');
const router = express.Router();
const OrderController = require('../controllers/OrderController');
const { verifyAccessToken } = require('../Helpers/JwtHelper');

router.post('/create', verifyAccessToken, OrderController.createOrder);
router.get('/user', verifyAccessToken, OrderController.getUserOrders);
router.patch('/update-status', verifyAccessToken, OrderController.updateOrderStatus);
router.delete('/delete/:id', verifyAccessToken, OrderController.deleteOrder);

module.exports = router;
