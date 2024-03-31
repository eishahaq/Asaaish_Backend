const express = require('express');
const OrderController = require('../controllers/OrderController'); 
const { signAccessToken, signRefreshToken, verifyRefreshToken, verifyAccessToken } = require('../Helpers/JwtHelper')


const router = express.Router();

router.post('/checkout', verifyAccessToken, OrderController.checkout);
router.get('/', verifyAccessToken, OrderController.getUserOrders);
router.get('/:orderId', verifyAccessToken, OrderController.getOrderDetails);
router.patch('/:orderId', verifyAccessToken, OrderController.updateOrder); // Consider PUT if you prefer replacing the entire order
router.delete('/:orderId', verifyAccessToken, OrderController.deleteOrder);

module.exports = router;
