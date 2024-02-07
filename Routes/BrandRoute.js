const express = require('express');
const router = express.Router();
const BrandController = require('../controllers/BrandController');

router.post('/createbrands', BrandController.createBrand);
router.get('/getbrands', BrandController.getAllBrands);
router.get('/brands/:id', BrandController.getBrandById);
router.put('/brands/:id', BrandController.updateBrand);
router.delete('/deletebrands/:id', BrandController.deleteBrand);

module.exports = router;
