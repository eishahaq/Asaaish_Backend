const express = require('express');
const router = express.Router();
const ProductController = require('../controllers/ProductController');
const { verifyAccessToken } = require('../Helpers/JwtHelper');

// Routes for product operations

router.post('/createproducts', verifyAccessToken, ProductController.createProduct); 

router.get('/getproducts', ProductController.getAllProducts); 

router.get('/getproducts/:id', ProductController.getProductById); 

router.get('/getproductsbybrand/:brandId', ProductController.getProductsByBrand); 

router.get('/productsbyvendor', verifyAccessToken, ProductController.getProductsByVendor);

router.put('/updateproducts/:id', verifyAccessToken, ProductController.updateProduct); 

router.delete('/deleteproducts/:id', verifyAccessToken, ProductController.deleteProduct); 

module.exports = router;