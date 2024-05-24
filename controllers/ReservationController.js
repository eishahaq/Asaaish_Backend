const Reservation = require('../Models/Reservation');
const Product = require('../models/Product');
const Inventory = require('../Models/Inventory');
const User = require('../Models/User');
const Vendor = require('../Models/Vendor');

const createError = require('http-errors');

const ReservationController = {
    // async createReservation(req, res, next) {
    //     try {
    //         const userId = req.payload.aud; // Extract user ID from JWT payload
    //         const { productId, inventoryId, variant } = req.body;

    //         // Check if the user has exceeded the reservation limit
    //         const reservationCount = await Reservation.countDocuments({ userId });
    //         if (reservationCount >= 3) {
    //             return res.status(400).json({ message: "Limit of 3 active reservations exceeded." });
    //         }

    //         // Check if the product variant is already reserved by this user
    //         const existingReservation = await Reservation.findOne({
    //             userId,
    //             'items.productId': productId,
    //             'items.inventoryId': inventoryId,
    //             'items.variant.color': variant.color,
    //             'items.variant.size': variant.size
    //         });

    //         if (existingReservation) {
    //             return res.status(400).json({ message: "You have already reserved this product variant." });
    //         }

    //         // Validate the inventory availability for the given variant
    //         const inventory = await Inventory.findById(inventoryId);
    //         const variantInInventory = inventory.variants.find(v => 
    //             v.color === variant.color && v.size === variant.size);

    //         if (!variantInInventory || variantInInventory.quantity < 1) {
    //             return res.status(401).json({ message: "Insufficient stock for this variant." });
    //         }

    //         // Create the reservation
    //         const reservation = new Reservation({
    //             userId,
    //             items: [{
    //                 productId,
    //                 inventoryId,
    //                 variant
    //             }]
    //         });

    //         await reservation.save();
    //         res.status(201).json({ message: 'Reservation created successfully.', reservation });
    //     } catch (error) {
    //         console.error('Reservation Error:', error);
    //         next(createError.InternalServerError());
    //     }
    // },

    // async createReservation(req, res, next) {
    //     try {
    //         const userId = req.payload.aud; // Extract user ID from JWT payload
    //         const { productId, inventoryId, variant } = req.body;
    
    //         // Validate ObjectId for inventoryId and productId
           
    
    //         // Attempt to find an existing reservation for the user
    //         let reservation = await Reservation.findOne({ userId });
    
    //         if (reservation && reservation.items.length >= 3) {
    //             return res.status(400).json({ message: "Limit of 3 active reservations exceeded." });
    //         }
    
    //         // Validate the inventory availability for the given variant
    //         const inventory = await Inventory.findById(inventoryId);
    //         const variantInInventory = inventory.variants.find(v => 
    //             v.color === variant.color && v.size === variant.size);
    
    //         if (!variantInInventory || variantInInventory.quantity < 1) {
    //             return res.status(401).json({ message: "Insufficient stock for this variant." });
    //         }
    
    //         const newItem = {
    //             productId,
    //             inventoryId,
    //             variant,
    //             status: 'Active'  // Add item status as "Active"
    //         };
    
    //         if (reservation) {
    //             // Add new item to existing reservation
    //             reservation.items.push(newItem);
    //         } else {
    //             // Create new reservation if none exists
    //             reservation = new Reservation({
    //                 userId,
    //                 items: [newItem]
    //             });
    //         }
    
    //         await reservation.save();
    //         res.status(201).json({ message: 'Reservation updated successfully.', reservation });
    //     } catch (error) {
    //         console.error('Reservation Error:', error);
    //         next(createError.InternalServerError());
    //     }
    // },  
    
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
    

    // async getUserReservations(req, res, next) {
    //     try {
    //         const userId = req.payload.aud; // Get user ID from JWT payload
    //         const reservations = await Reservation.find({ userId })
    //             .populate('items.productId')
    //             .populate('items.inventoryId');

    //         res.status(200).json(reservations);
    //     } catch (error) {
    //         next(createError.InternalServerError(error));
    //     }
    // },
    
    // async getUserReservations(req, res, next) {
    //     try {
    //         const userId = req.payload.aud; // Get user ID from JWT payload
    //         console.log('userrr' + userId);
    //         // Adjust the find query to include a check for items with status 'Active'
    //         const reservations = await Reservation.find({
    //             userId,
    //             'items.status': "Active", // This condition filters the reservations to include only those items that are 'Active'
    //         })
    //         .populate('items.productId')
    //         .populate('items.inventoryId');
    //         console.log(reservations);
    //         res.status(200).json(reservations);
    //     } catch (error) {
    //         next(createError.InternalServerError(error));
    //     }
    // },

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

            // Retrieve all reservations for the user
            const reservations = await Reservation.find({ userId })
                .populate('items.productId')
                .populate('items.inventoryId')
                .lean();  // Use lean() for faster execution since we just need to process the data

            // Filter out only active items from each reservation
            const activeReservations = reservations.map(reservation => {
                const activeItems = reservation.items.filter(item => item.status === 'Active');
                return { ...reservation, items: activeItems };
            }).filter(reservation => reservation.items.length > 0);  // Filter out reservations with no active items

            if (!activeReservations.length) {
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
    
            const vendor = await Vendor.findOne({ user: vendorId }).exec();
            if (!vendor) {
                return res.status(404).json({ message: "Vendor not found" });
            }
            const storeIds = vendor.stores;
    
            const inventories = await Inventory.find({ storeId: { $in: storeIds } }).exec();
            const inventoryIds = inventories.map(inventory => inventory._id);
    
            const reservations = await Reservation.find({
                'items.inventoryId': { $in: inventoryIds }
            }).populate('items.productId').populate('items.inventoryId');
    
            res.status(200).json(reservations);
        } catch (error) {
            next(createError.InternalServerError(error));
        }
    },  
    
    
    
    

    async cancelReservationCustomer(req, res, next) {
        try {
            console.log("hello api");
            
            // if (!req.payload.aud) {
            //     console.log("hello error");
            //     return res.status(401).json({ message: "No authentication token provided." });
        
            // }
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
    
            // Find the reservation and update the specific item
            const reservation = await Reservation.findOneAndUpdate(
                { "_id": reservationId, "items._id": itemId },
                { "$set": { "items.$.status": "Cancelled by Vendor" } },
                { new: true } // Return the updated document
            );
    
            if (!reservation) {
                return res.status(404).json({ message: "Reservation or item not found." });
            }
    
            res.status(200).json({ message: 'Reservation item cancelled by vendor successfully.', reservation });
        } catch (error) {
            console.error('Error cancelling reservation item by vendor:', error);
            next(createError.InternalServerError(error));
        }
    }
    
    
};

module.exports = ReservationController;
