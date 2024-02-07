const express = require('express');
const router = express.Router();
const InventoryController = require('../controllers/InventoryController');

// Routes for inventory operations
router.post('/createinventory', InventoryController.addInventory); // Add new inventory
router.get('/getinventory/product/:productId', InventoryController.getInventoryByProduct); // Get inventory by product ID
router.get('/getinventory/store/:storeId', InventoryController.getInventoryByStore); // Get inventory by store ID
router.put('/getinventory/:id', InventoryController.updateInventory); // Update inventory
router.delete('/getinventory/:id', InventoryController.deleteInventory); // Delete inventory

module.exports = router;
