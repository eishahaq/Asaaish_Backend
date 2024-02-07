const express = require('express');
const router = express.Router();
const ProductController = require('../controllers/ProductController');

// Routes for product operations
router.post('/createproducts', ProductController.createProduct); // Create a new product
router.get('/getproducts', ProductController.getAllProducts); // Get all products
router.get('/getproducts/:id', ProductController.getProductById); // Get a single product by ID
router.put('/updateproducts/:id', ProductController.updateProduct); // Update a product
router.delete('/deleteproducts/:id', ProductController.deleteProduct); // Delete a product

module.exports = router;
