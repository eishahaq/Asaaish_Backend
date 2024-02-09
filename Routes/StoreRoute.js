const express = require('express');
const router = express.Router();
const StoreController = require('../controllers/StoreController');
const { verifyAccessToken } = require('../Helpers/JwtHelper');

// Routes for store operations

router.post('/create', verifyAccessToken, StoreController.createStore);

router.get('/all', verifyAccessToken, StoreController.getAllStores);

router.get('/vendor', verifyAccessToken, StoreController.getVendorStores);

router.get('/brand', verifyAccessToken, StoreController.getBrandStores);

router.put('/:id', verifyAccessToken, StoreController.updateStore);

router.delete('/:id', verifyAccessToken, StoreController.deleteStore);

module.exports = router;