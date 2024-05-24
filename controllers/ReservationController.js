const Reservation = require('../Models/Reservation');
const Product = require('../Models/Product');
const Inventory = require('../Models/Inventory');
const User = require('../Models/User');
const createError = require('http-errors');
const Vendor = require('../Models/Vendor'); // Add this line to import the Vendor model


const ReservationController = {
    async createReservation(req, res, next) {
        try {
            const userId = req.payload.aud; // Extract user ID from JWT payload
            const { productId, inventoryId, variant } = req.body;
    
            // Attempt to find all existing reservations for the user
            let reservations = await Reservation.find({ userId });
    
            // Calculate the total number of 'Active' items across all reservations
            const activeItemCount = reservations.reduce((count, reservation) => {
                return count + reservation.items.filter(item => item.status === 'Active').length;
            }, 0);
    
            if (activeItemCount >= 3) {
                return res.status(400).json({ message: "Limit of 3 active reservations exceeded." });
            }
    
            // Validate the inventory availability for the given variant
            const inventory = await Inventory.findById(inventoryId);
            const variantInInventory = inventory.variants.find(v => 
                v.color === variant.color && v.size === variant.size);
    
            if (!variantInInventory || variantInInventory.quantity < 1) {
                return res.status(401).json({ message: "Insufficient stock for this variant." });
            }
    
            const newItem = {
                productId,
                inventoryId,
                variant,
                status: 'Active'  // Add item status as "Active"
            };
    
            let reservation = reservations.length > 0 ? reservations[0] : new Reservation({ userId, items: [] });
            reservation.items.push(newItem);
    
            await reservation.save();
            res.status(201).json({ message: 'Reservation updated successfully.', reservation });
        } catch (error) {
            console.error('Reservation Error:', error);
            next(createError.InternalServerError());
        }
    },    
    

    async updateExpiredReservations(req, res, next) {
        const now = new Date();
        try {
            // Find reservations that have any item that has expired and is still marked as 'Active'
            const reservations = await Reservation.find({
                'items': {
                    $elemMatch: { // Use $elemMatch to ensure all conditions must match for the same item
                        expiresAt: { $lt: now },
                        status: 'Active'
                    }
                }
            }).lean();
    
            if (reservations.length > 0) {
                await Promise.all(reservations.map(async (reservation) => {
                    const updatedItems = reservation.items.map(item => {
                        // Check if the item has expired and is marked 'Active'
                        if (item.expiresAt < now && item.status === 'Active') {
                            item.status = 'Expired'; // Update the status to 'Expired'
                        }
                        return item;
                    });
    
                    // Update the reservation in the database with the modified items
                    await Reservation.updateOne(
                        { _id: reservation._id },
                        { $set: { items: updatedItems } }
                    );
                }));
    
                console.log(`Updated ${reservations.length} reservations to Expired.`);
            }
    
            next();  // Proceed to the next middleware or controller
        } catch (error) {
            console.error('Failed to update expired reservations:', error);
            next(createError.InternalServerError());
        }
    },
    async getUserReservations(req, res, next) {
        try {
            const userId = req.payload.aud;  // Extract user ID from JWT payload
            console.log(`User ID: ${userId}`);
    
            // Retrieve all reservations for the user
            const reservations = await Reservation.find({ userId })
                .populate('items.productId')
                .populate('items.inventoryId')
                .lean();  // Use lean() for faster execution since we just need to process the data
            console.log(`Reservations found for user ${userId}: ${JSON.stringify(reservations)}`);
    
            // Filter out only active items from each reservation
            const activeReservations = reservations.map(reservation => {
                const activeItems = reservation.items.filter(item => item.status === 'Active');
                console.log(`Active items for reservation ${reservation._id}: ${JSON.stringify(activeItems)}`);
                return { ...reservation, items: activeItems };
            }).filter(reservation => reservation.items.length > 0);  // Filter out reservations with no active items
    
            console.log(`Active reservations for user ${userId}: ${JSON.stringify(activeReservations)}`);
    
            if (!activeReservations.length) {
                console.log(`No active reservations found for user ${userId}`);
                return res.status(404).json({ message: 'No active reservations found.' });
            }
    
            res.status(200).json(activeReservations);
        } catch (error) {
            console.error('Error retrieving user reservations:', error);
            next(createError.InternalServerError());
        }
    },
    

    async getVendorReservations(req, res, next) {
        try {
            const vendorId = req.payload.aud;
    
            // Find the vendor associated with the user
            const vendor = await Vendor.findOne({ user: vendorId }).exec();
            if (!vendor) {
                console.log('Vendor not found for user ID:', vendorId);
                return res.status(404).json({ message: "Vendor not found" });
            }
    
            // Get the store IDs associated with the vendor
            const storeIds = vendor.stores;
    
            // Find the inventories associated with the store IDs
            const inventories = await Inventory.find({ storeId: { $in: storeIds } }).exec();
            const inventoryIds = inventories.map(inventory => inventory._id);
    
            // Find reservations that have items with inventory IDs in the vendor's stores
            const reservations = await Reservation.find({
                'items.inventoryId': { $in: inventoryIds }
            }).populate('items.productId').populate('items.inventoryId');
    
            // Map over the reservations to include the product code in the response
            const reservationsWithProductCode = reservations.map(reservation => {
                const itemsWithProductCode = reservation.items.map(item => ({
                    ...item.toObject(),
                    productCode: item.productId.productCode
                }));
                return {
                    ...reservation.toObject(),
                    items: itemsWithProductCode
                };
            });
    
            res.status(200).json(reservationsWithProductCode);
        } catch (error) {
            next(createError.InternalServerError(error));
        }
    },
    
    
    async cancelReservationCustomer(req, res, next) {
        try {
            console.log("hello api");
            
            console.log("hello api 2");

            const userId = req.payload.aud; // Extract user ID from JWT payload
            console.log("user" +userId);
            const { reservationId, itemId } = req.params; // Extract reservation and item ID from request parameters
            console.log("user "+ userId + "reserv "+reservationId + "item "+itemId);
            // Verify reservation belongs to the user and update the specific item's status
            const updatedReservation = await Reservation.findOneAndUpdate(
                { "_id": reservationId, "userId": userId, "items._id": itemId },
                { "$set": { "items.$.status": "Cancelled by Customer" } },
                { new: true } // Return the updated document
            );
    
            if (!updatedReservation) {
                return res.status(404).json({ message: "Reservation not found or item does not belong to the user." });
            }
    
            res.status(200).json({ message: "Reservation item cancelled by customer successfully.", reservation: updatedReservation });
        } catch (error) {
            console.error('Error cancelling reservation by customer:', error);
            next(createError.InternalServerError(error));
        }
    },
    
    async cancelReservationVendor(req, res, next) {
        try {
            const reservationId = req.params.reservationId;
            const itemId = req.params.itemId; // Assuming you pass the itemId to specifically cancel an item within a reservation
            
            console.log(`Received request to cancel reservation item. Reservation ID: ${reservationId}, Item ID: ${itemId}`);
            
            // Find the reservation and update the specific item
            const reservation = await Reservation.findOneAndUpdate(
                { "_id": reservationId, "items._id": itemId },
                { "$set": { "items.$.status": "Cancelled by Vendor" } },
                { new: true } // Return the updated document
            );
            
            console.log(`Reservation after update attempt: ${JSON.stringify(reservation)}`);
            
            if (!reservation) {
                console.log(`Reservation or item not found. Reservation ID: ${reservationId}, Item ID: ${itemId}`);
                return res.status(404).json({ message: "Reservation or item not found." });
            }
            
            console.log(`Reservation item cancelled by vendor successfully. Reservation: ${JSON.stringify(reservation)}`);
            res.status(200).json({ message: 'Reservation item cancelled by vendor successfully.', reservation });
        } catch (error) {
            console.error('Error cancelling reservation item by vendor:', error);
            next(createError.InternalServerError(error));
        }
    },
    async completeReservationVendor(req, res, next) {
        try {
            const reservationId = req.params.reservationId;
            const itemId = req.params.itemId; // Assuming you pass the itemId to specifically complete an item within a reservation
            
            console.log(`Received request to complete reservation item. Reservation ID: ${reservationId}, Item ID: ${itemId}`);
            
            // Find the reservation
            const reservation = await Reservation.findOne({ "_id": reservationId, "items._id": itemId });
            
            if (!reservation) {
                console.log(`Reservation or item not found. Reservation ID: ${reservationId}, Item ID: ${itemId}`);
                return res.status(404).json({ message: "Reservation or item not found." });
            }
            
            // Find the specific item within the reservation
            const item = reservation.items.id(itemId);
            
            if (!item) {
                console.log(`Item not found. Item ID: ${itemId}`);
                return res.status(404).json({ message: "Item not found." });
            }
            
            // Check if item is already completed
            if (item.status === 'Completed') {
                console.log(`Item already completed. Item ID: ${itemId}`);
                return res.status(400).json({ message: "Item already completed." });
            }
            
            // Update item status to 'Completed'
            item.status = 'Completed';
            
            // Find the inventory and update the quantity
            const inventory = await Inventory.findById(item.inventoryId);
            const variantInInventory = inventory.variants.find(v => 
                v.color === item.variant.color && v.size === item.variant.size);
            
            if (!variantInInventory) {
                console.log(`Inventory variant not found. Inventory ID: ${item.inventoryId}`);
                return res.status(404).json({ message: "Inventory variant not found." });
            }
            
            // Reduce quantity by 1
            if (variantInInventory.quantity < 1) {
                console.log(`Insufficient stock for inventory variant. Inventory ID: ${item.inventoryId}`);
                return res.status(400).json({ message: "Insufficient stock for inventory variant." });
            }
            
            variantInInventory.quantity -= 1;
            
            // Save the updated inventory
            await inventory.save();
            
            // Save the updated reservation
            await reservation.save();
            
            console.log(`Reservation item completed successfully. Reservation: ${JSON.stringify(reservation)}`);
            res.status(200).json({ message: 'Reservation item completed successfully.', reservation });
        } catch (error) {
            console.error('Error completing reservation item by vendor:', error);
            next(createError.InternalServerError(error));
        }
    }
    
    
};

module.exports = ReservationController;
