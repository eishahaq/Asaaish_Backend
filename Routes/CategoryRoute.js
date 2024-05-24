const express = require('express');
const router = express.Router();
const CategoryController = require('../controllers/CategoryController');
const { verifyAccessToken } = require('../Helpers/JwtHelper');

router.post('/createcategory', CategoryController.createCategory);

router.get('/categories', CategoryController.getAllCategories);

router.get('/category/:id', verifyAccessToken, CategoryController.getCategoryById);

router.put('/updatecategory/:id', CategoryController.updateCategory);

router.delete('/deletecategory/:id',CategoryController.deleteCategory);

module.exports = router;
