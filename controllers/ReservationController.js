const Reservation = require('../Models/Reservation');
const Product = require('../Models/Product');
const Inventory = require('../Models/Inventory');
const Brand = require('../Models/Brand');
const Store = require('../Models/Store');
const User = require('../Models/User');
const createError = require('http-errors');

const ReservationController = { 
    
    async createReservation(req, res, next) {
        try {
            const userId = req.payload.aud; 
            const { productId, inventoryId, variant } = req.body;
    
            let reservations = await Reservation.find({ userId });
    
            const activeItemCount = reservations.reduce((count, reservation) => {
                return count + reservation.items.filter(item => item.status === 'Active').length;
            }, 0);
    
            if (activeItemCount >= 3) {
                return res.status(400).json({ message: "Limit of 3 active reservations exceeded." });
            }
    
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
                status: 'Active' 
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
            const reservations = await Reservation.find({
                'items': {
                    $elemMatch: { 
                        expiresAt: { $lt: now },
                        status: 'Active'
                    }
                }
            }).lean();
    
            if (reservations.length > 0) {
                await Promise.all(reservations.map(async (reservation) => {
                    const updatedItems = reservation.items.map(item => {
                        if (item.expiresAt < now && item.status === 'Active') {
                            item.status = 'Expired'; 
                        }
                        return item;
                    });
    
                    await Reservation.updateOne(
                        { _id: reservation._id },
                        { $set: { items: updatedItems } }
                    );
                }));
    
                console.log(`Updated ${reservations.length} reservations to Expired.`);
            }
    
            next();  
        } catch (error) {
            console.error('Failed to update expired reservations:', error);
            next(createError.InternalServerError());
        }
    },
    async getUserReservations(req, res, next) {
        try {
            const userId = req.payload.aud;  

            const reservations = await Reservation.find({ userId })
                .populate('items.productId')
                .populate('items.inventoryId')
                .lean();  

            const activeReservations = reservations.map(reservation => {
                const activeItems = reservation.items.filter(item => item.status === 'Active');
                return { ...reservation, items: activeItems };
            }).filter(reservation => reservation.items.length > 0);  

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
            const products = await Product.find({ vendor: vendorId });
            const productIds = products.map(product => product._id);

            const reservations = await Reservation.find({
                'items.productId': { $in: productIds }
            }).populate('items.productId').populate('items.inventoryId');

            res.status(200).json(reservations);
        } catch (error) {
            next(createError.InternalServerError(error));
        }
    },

    async cancelReservationCustomer(req, res, next) {
        try {
            console.log("hello api");
        
            console.log("hello api 2");

            const userId = req.payload.aud;
            console.log("user" +userId);
            const { reservationId, itemId } = req.params; 
            console.log("user "+ userId + "reserv "+reservationId + "item "+itemId);
            const updatedReservation = await Reservation.findOneAndUpdate(
                { "_id": reservationId, "userId": userId, "items._id": itemId },
                { "$set": { "items.$.status": "Cancelled by Customer" } },
                { new: true } 
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
            const itemId = req.params.itemId; 
    
            const reservation = await Reservation.findOneAndUpdate(
                { "_id": reservationId, "items._id": itemId },
                { "$set": { "items.$.status": "Cancelled by Vendor" } },
                { new: true } 
            );
    
            if (!reservation) {
                return res.status(404).json({ message: "Reservation or item not found." });
            }
    
            res.status(200).json({ message: 'Reservation item cancelled by vendor successfully.', reservation });
        } catch (error) {
            console.error('Error cancelling reservation item by vendor:', error);
            next(createError.InternalServerError(error));
        }
    },

    async getAllReservations(req, res, next) {
        try {
            const reservations = await Reservation.find()
                .populate('userId', 'name email')  
                .populate({
                    path: 'items.productId',
                    select: 'name brandId',
                    populate: {
                        path: 'brandId',
                        select: 'name'
                    }
                })
                .populate({
                    path: 'items.inventoryId',
                    select: 'storeId',
                    populate: {
                        path: 'storeId',
                        select: 'name address',
                        populate: {
                            path: 'brand',
                            select: 'name'
                        }
                    }
                });

            res.status(200).json(reservations);
        } catch (error) {
            console.error('Error fetching all reservations:', error);
            next(createError.InternalServerError());
        }
    },

    async deleteReservation(req, res, next) {
        try {
            const { reservationId } = req.params;

            const reservation = await Reservation.findOneAndDelete({ _id: reservationId });

            if (!reservation) {
                return res.status(404).json({ message: "Reservation not found or does not belong to the user." });
            }

            res.status(200).json({ message: "Reservation deleted successfully." });
        } catch (error) {
            console.error('Error deleting reservation:', error);
            next(createError.InternalServerError());
        }
    },

    async editReservation(req, res, next) {
        try {
            const { reservationId, itemId } = req.params;
            const userId = req.payload.aud; 
            const { variant } = req.body;

            const reservation = await Reservation.findOneAndUpdate(
                { _id: reservationId, userId, 'items._id': itemId },
                { '$set': { 'items.$.variant': variant } },
                { new: true } 
            );

            if (!reservation) {
                return res.status(404).json({ message: "Reservation not found or item does not belong to the user." });
            }

            res.status(200).json({ message: "Reservation updated successfully.", reservation });
        } catch (error) {
            console.error('Error editing reservation:', error);
            next(createError.InternalServerError());
        }
    }
    
    
};

module.exports = ReservationController;
