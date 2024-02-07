const express = require('express');
const router = express.Router();
<<<<<<< HEAD
const StoreController = require('../controllers/StoreController');

router.post('/createstores', StoreController.createStore);
router.get('/getstores', StoreController.getAllStores);
router.get('/getstores/:id', StoreController.getStoreById);
router.put('/updatestores/:id', StoreController.updateStore);
router.delete('/deletestores/:id', StoreController.deleteStore);

module.exports = router;
=======
const { signAccessToken, signRefreshToken, verifyRefreshToken, verifyAccessToken } = require('../Helpers/JwtHelper')


const StoreController = require('../controllers/StoreController');
const AuthenticationController = require('../controllers/AuthenticationController'); 

// User routes
router.post('/create', StoreController.createStore); 

// Authentication routes
router.post('/refresh-token', AuthenticationController.refreshToken);

module.exports = router;
>>>>>>> 0b1847d2d255b4aa7477c63be969714165fecbc5
