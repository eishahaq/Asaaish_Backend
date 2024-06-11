const express = require('express');
const router = express.Router();
const InventoryController = require('../controllers/InventoryController');
const { verifyAccessToken } = require('../Helpers/JwtHelper');


router.post('/createinventory', verifyAccessToken, InventoryController.addInventory); 

router.get('/allinventory', verifyAccessToken, InventoryController.getAllInventory);

router.get('/getinventory/product/:productId', InventoryController.getInventoryByProduct); 

router.get('/getinventory/productsByStore/:storeId', InventoryController.getProductsByStore);

router.get('/getinventory/getInventoryByStoreAndProduct/:storeId/:productId', InventoryController.getInventoryByStoreAndProduct);

router.get('/getproductvariants/:productId', InventoryController.getProductVariants);

//router.get('/getinventory/inventorybyStoreAndBrand/:storeId', InventoryController.getInventoryByStoreAndBrand);

router.get('/getinventory/store/:storeId', verifyAccessToken, InventoryController.getInventoryByStore); 

router.get('/location/:inventoryId', InventoryController.getStoreLocationByInventoryId);

router.get('/location/product/:productId/', InventoryController.getAllStoreLocationsForProduct);

router.put('/inventory/:id', InventoryController.updateInventory);
router.delete('/inventory/:id', InventoryController.deleteInventory);

module.exports = router;    
