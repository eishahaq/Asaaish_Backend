const express = require('express');
const router = express.Router();
const StoreController = require('../controllers/StoreController');

router.post('/createstores', StoreController.createStore);
router.get('/getstores', StoreController.getAllStores);
router.get('/getstores/:id', StoreController.getStoreById);
router.put('/updatestores/:id', StoreController.updateStore);
router.delete('/deletestores/:id', StoreController.deleteStore);

module.exports = router;
