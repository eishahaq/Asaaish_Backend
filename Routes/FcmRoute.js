// FCMRoute.js
const express = require('express');
const router = express.Router();
const { verifyAccessToken } = require('../Helpers/JwtHelper');
const FCMController = require('../controllers/FcmController');

router.post('/store-token', verifyAccessToken, FCMController.storeToken);

module.exports = router;