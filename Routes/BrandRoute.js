const express = require('express');
const BrandController = require('../controllers/BrandController'); 
const { verifyAccessToken } = require('../Helpers/JwtHelper');

const router = express.Router();

// Routes for brand operations

router.post('/brands', verifyAccessToken, BrandController.createBrand);

router.get('/brands', BrandController.getAllBrands);

router.get('/brands/:id', BrandController.getBrandById);

router.put('/brands/:id', verifyAccessToken, BrandController.updateBrand);

router.delete('/brands/:id', verifyAccessToken, BrandController.deleteBrand);

module.exports = router;
