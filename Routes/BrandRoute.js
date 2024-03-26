const express = require('express');
const BrandController = require('../controllers/BrandController'); 
const { verifyAccessToken } = require('../Helpers/JwtHelper')

const router = express.Router();

router.post('/create', verifyAccessToken, BrandController.createBrand);

router.get('/getbrands', BrandController.getAllBrands);

router.get('/:id', BrandController.getBrandById);

router.put('/:id', verifyAccessToken, BrandController.updateBrand);

router.delete('/:id', verifyAccessToken, BrandController.deleteBrand);

module.exports = router;
