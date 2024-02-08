const express = require('express');
const BrandController = require('../controllers/BrandController'); 
const { verifyAccessToken } = require('../Helpers/JwtHelper')

const router = express.Router();

router.post('/brands', verifyAccessToken, BrandController.createBrand);

router.get('/brands', BrandController.getAllBrands);

router.get('/brands/:id', BrandController.getBrandById);

router.put('/brands/:id', verifyAccessToken, BrandController.updateBrand);

// DELETE request to delete a brand
router.delete('/brands/:id', verifyAccessToken, BrandController.deleteBrand);

module.exports = router;
