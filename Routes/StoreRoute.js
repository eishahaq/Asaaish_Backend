const express = require('express');
const router = express.Router();
const { signAccessToken, signRefreshToken, verifyRefreshToken, verifyAccessToken } = require('../Helpers/JwtHelper')


const StoreController = require('../controllers/StoreController');
const AuthenticationController = require('../controllers/AuthenticationController'); 

// User routes
router.post('/create', StoreController.createStore); 

// Authentication routes
router.post('/refresh-token', AuthenticationController.refreshToken);

module.exports = router;