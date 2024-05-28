// File: routes/cartRoutes.js
const express = require('express');
const router = express.Router();
const CartController = require('../controllers/CartController');
const { verifyAccessToken } = require('../Helpers/JwtHelper');

router.post('/add', verifyAccessToken, CartController.addToCart);
router.get('/', verifyAccessToken, CartController.getCart);
router.delete('/remove', verifyAccessToken, CartController.removeFromCart); // Define params accordingly
router.post('/update', verifyAccessToken, CartController.updateCartItem); // Define params accordingly
router.post('/checkout', verifyAccessToken, CartController.checkout);
router.delete('/clear', verifyAccessToken, CartController.clearCart); // Add this line

module.exports = router;
