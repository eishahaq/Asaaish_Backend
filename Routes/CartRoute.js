const express = require('express');
const CartController = require('../controllers/CartController');

const router = express.Router();

// Route to validate adding a product to the cart
router.post('/validate-add', CartController.validateProductAddition);

// Route to validate removing a product from the cart
router.post('/validate-remove', CartController.validateProductRemoval);

// Route to check the contents of the cart
router.post('/check-contents', CartController.checkCartContents);

// Route to clear the cart
router.post('/clear', CartController.clearCart);

module.exports = router;
