const express = require('express');
const router = express.Router();
const ProductController = require('../controllers/ProductController');
const { verifyAccessToken } = require('../Helpers/JwtHelper');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' }); // This will save files to an 'uploads' folder


// Routes for product operations

router.post('/createproducts', verifyAccessToken, ProductController.createProduct); 

router.get('/getproducts', verifyAccessToken, ProductController.getAllProducts); 

router.get('/getproducts/:id', ProductController.getProductById); 

router.get('/getproductsbybrand/:brandId', ProductController.getProductsByBrand); 

//router.get('/productsbyvendor', verifyAccessToken, ProductController.getProductsByVendor);

router.put('/updateproducts/:id', verifyAccessToken, ProductController.updateProduct); 

router.delete('/deleteproducts/:id', verifyAccessToken, ProductController.deleteProduct); 
router.post('/bulk-import', verifyAccessToken, upload.single('file'), ProductController.bulkImportProducts);

router.get('/by-store/:storeId', ProductController.getProductsByStore);

module.exports = router;
