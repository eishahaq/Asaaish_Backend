const express = require('express');
const router = express.Router();
const CategoryController = require('../controllers/CategoryController');
const { verifyAccessToken } = require('../Helpers/JwtHelper');

// Route to create a new category (Admin only)
router.post('/createcategory', CategoryController.createCategory);

// Route to get all categories
router.get('/categories', CategoryController.getAllCategories);

// Route to get a single category by ID
router.get('/category/:id', verifyAccessToken, CategoryController.getCategoryById);

// Route to update a category by ID (Admin only)
router.put('/updatecategory/:id', CategoryController.updateCategory);

// Route to delete a category by ID (Admin only)
router.delete('/deletecategory/:id',CategoryController.deleteCategory);

module.exports = router;
