const express = require('express');
const OrderController = require('../controllers/OrderController'); 
const { signAccessToken, signRefreshToken, verifyRefreshToken, verifyAccessToken } = require('../Helpers/JwtHelper')


const router = express.Router();

// Route to create a new order
router.post('/create',verifyAccessToken, OrderController.createOrder);

// Route to get all orders
router.get('/all', OrderController.getAllOrders);

// Route to get all orders by a specific store
router.get('/store/:storeId', OrderController.getOrdersByStore);

module.exports = router;
