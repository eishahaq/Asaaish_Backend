const express = require('express');
const router = express.Router();
const ProductController = require('../controllers/ProductController');
const { verifyAccessToken } = require('../Helpers/JwtHelper');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' }); // This will save files to an 'uploads' folder


// Routes for product operations

router.post('/createproducts', verifyAccessToken, ProductController.createProduct); 

router.get('/getproducts', ProductController.getAllProducts); 

router.get('/getdiffproducts', ProductController.getAllProducts); 


router.get('/getproducts/:id', ProductController.getProductById); 

router.get('/getproductsbybrand/:brandId', ProductController.getProductsByBrand); 

router.get('/getproductsbycategory/:categoryId', ProductController.getProductsByCategory);
router.get('/getproductsbytags', ProductController.getProductsByTags);
router.get('/outfit', ProductController.makeOutfit);
router.get('/combooutfit', ProductController.makeancomboOutfit);

//router.get('/productsbyvendor', verifyAccessToken, ProductController.getProductsByVendor);
router.put('/updateproducts/:id', verifyAccessToken, ProductController.updateProduct); 

router.delete('/deleteproducts/:id', verifyAccessToken, ProductController.deleteProduct); 
router.post('/bulk-import', verifyAccessToken, upload.single('file'), ProductController.bulkImportProducts);

router.get('/products-by-store/:storeId', ProductController.getProductsByStore);
router.get('/inventory-by-store/:storeId', ProductController.getInventoryByStore);


module.exports = router;
