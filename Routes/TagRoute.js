const express = require('express');
const router = express.Router();
const TagController = require('../controllers/TagController'); 
const { verifyAccessToken } = require('../Helpers/JwtHelper');

router.post('/createtag', verifyAccessToken, TagController.createTag); 

router.get('/tags', TagController.getAllTags); 

router.get('/tag/:id', verifyAccessToken, TagController.getTagById); 

router.get('/by-category/:parentCategoryId', TagController.getTagsByParentCategory);

router.put('/updatetag/:id', verifyAccessToken, TagController.updateTag); 

router.delete('/deletetag/:id', verifyAccessToken, TagController.deleteTag); 

module.exports = router;
