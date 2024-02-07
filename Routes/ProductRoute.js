const express = require('express');
const router = express.Router();
const { signAccessToken, signRefreshToken, verifyRefreshToken, verifyAccessToken } = require('../Helpers/JwtHelper')
const multer = require('multer');
const upload = multer({ dest: 'uploads/' }); // 'uploads/' is the folder where files will be saved



const ProductController = require('../controllers/ProductController');
const AuthenticationController = require('../controllers/AuthenticationController'); 

// User routes
router.post('/add', ProductController.addProduct); 
router.post('/import',  upload.single('file'), ProductController.importProducts); 


// Authentication routes
router.post('/refresh-token', AuthenticationController.refreshToken);

module.exports = router;