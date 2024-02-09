const express = require('express');
const router = express.Router();
const ProductController = require('../controllers/ProductController');
const { verifyAccessToken } = require('../Helpers/JwtHelper');

// Routes for product operations

router.post('/createproducts', verifyAccessToken, ProductController.createProduct); 

router.get('/getproducts', verifyAccessToken, ProductController.getAllProducts); 

router.get('/getproducts/:id', verifyAccessToken, ProductController.getProductById); 

router.put('/updateproducts/:id', verifyAccessToken, ProductController.updateProduct); 

router.delete('/deleteproducts/:id', verifyAccessToken, ProductController.deleteProduct); 

module.exports = router;
