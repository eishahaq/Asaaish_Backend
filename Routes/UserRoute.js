const express = require('express');
const router = express.Router();
const { verifyAccessToken } = require('../Helpers/JwtHelper');

const UserController = require('../controllers/UserController');
const AuthenticationController = require('../controllers/AuthenticationController'); 

// User routes

router.get('/user/:id', verifyAccessToken, UserController.getUserById);

router.get('/getall', verifyAccessToken, UserController.getAllUsers);

router.put('/updateuser', verifyAccessToken, UserController.updateUser);

router.delete('/:id', verifyAccessToken, UserController.deleteUser);

// Authentication routes

router.post('/signup', AuthenticationController.signup);

router.post('/login', AuthenticationController.login);

router.post('/refresh-token', AuthenticationController.refreshToken);

module.exports = router;