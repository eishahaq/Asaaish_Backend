const express = require('express');
const router = express.Router();
const TagController = require('../controllers/TagController'); // Updated to TagController
const { verifyAccessToken } = require('../Helpers/JwtHelper');

// Route to create a new tag
router.post('/createtag', verifyAccessToken, TagController.createTag); // Updated route and controller method

// Route to get all tags
router.get('/tags', TagController.getAllTags); // Updated route and controller method

// Route to get a single tag by ID
router.get('/tag/:id', verifyAccessToken, TagController.getTagById); // Updated route and controller method

// Route to get a single tag by Category
router.get('/by-category/:parentCategoryId', TagController.getTagsByParentCategory);

// Route to update a tag by ID
router.put('/updatetag/:id', verifyAccessToken, TagController.updateTag); // Updated route and controller method

// Route to delete a tag by ID
router.delete('/deletetag/:id', verifyAccessToken, TagController.deleteTag); // Updated route and controller method

module.exports = router;
