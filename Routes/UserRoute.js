const express = require('express');
const router = express.Router();
const {  verifyAccessToken } = require('../Helpers/JwtHelper')
const UserController = require('../controllers/UserController');
const AuthenticationController = require('../controllers/AuthenticationController'); 

router.get('/users', verifyAccessToken, UserController.getAllUsers); 

router.get('/customers', UserController.getAllCustomers); 

router.get('/vendors', UserController.getAllVendors); 

router.get('/userbyid', verifyAccessToken,UserController.getUserById); 
router.get('/vendorbyid', verifyAccessToken,UserController.getVendorByUserId); 
router.put('/updateUser', verifyAccessToken, UserController.updateUser)
router.put('/user/:id', verifyAccessToken,UserController.updateUser); 

router.put('/vendor/:id', verifyAccessToken,UserController.updateVendor); 

router.delete('/:id', verifyAccessToken, UserController.deleteUser);


router.post('/signup', AuthenticationController.signup);

router.post('/login', AuthenticationController.login);

router.post('/refresh-token', AuthenticationController.refreshToken);

module.exports = router;