const express = require('express');
const router = express.Router();
const { signAccessToken, signRefreshToken, verifyRefreshToken, verifyAccessToken } = require('../Helpers/JwtHelper')


const UserController = require('../controllers/UserController');
const AuthenticationController = require('../controllers/AuthenticationController'); 

// User routes
router.get('/', verifyAccessToken, UserController.getUserById);
router.put('/update', verifyAccessToken, UserController.updateUser);
router.delete('/:id', verifyAccessToken, UserController.deleteUser);
router.get('/users', UserController.getAllUsers); 
router.get('/vendorbyid', verifyAccessToken,UserController.getVendorByUserId); 

// Authentication routes
router.post('/signup', AuthenticationController.signup);
router.post('/login', AuthenticationController.login);
router.post('/refresh-token', AuthenticationController.refreshToken);

module.exports = router;