const express = require('express');
const router = express.Router();
const collectionController = require('../controllers/CollectionController'); 
const { verifyAccessToken } = require('../Helpers/JwtHelper');

router.post('/createcollection', collectionController.createCollection);
router.get('/collections', collectionController.getAllCollections);
router.get('/collections/:id', collectionController.getCollectionById);
router.put('/updatecollections/:id', collectionController.updateCollection);
router.delete('/deletecollections/:id', collectionController.deleteCollection);

module.exports = router;
