const Cart = require('../Models/Cart');
const Inventory = require('../Models/Inventory');
const User = require('../Models/User');
const Product = require('../Models/Product');
const createError = require('http-errors');
const mongoose = require('mongoose');

const CartController = {
    async addToCart(req, res, next) {
        try {
            const userId = req.payload.aud; 
            console.log(`userId: ${userId}`);
            const { productId, inventoryId, quantity, variant } = req.body;
            console.log(`product id ${productId} inventory id ${inventoryId} quantity ${quantity} variant ${variant}`);    

            const inventoryItem = await Inventory.findById(inventoryId);
            console.log(`inventory item ${inventoryItem}`);
            if (!inventoryItem) throw createError.NotFound('Inventory item not found');

            const variantInInventory = inventoryItem.variants.find(v => 
                v.color === variant.color && v.size === variant.size
            );

            if (!variantInInventory || variantInInventory.quantity < quantity) {
                throw createError.BadRequest('Requested quantity exceeds available stock');
            }
            console.log(`variant in inventory item ${variantInInventory}`);
            let cart = await Cart.findOne({ userId });
            console.log(`cart: ${cart}`);
            if (!cart) {
                cart = new Cart({ userId, items: [] });
            }

            const itemIndex = cart.items.findIndex(item =>
                item.productId.toString() === productId &&
                item.variant.color === variant.color &&
                item.variant.size === variant.size
            );

            if (itemIndex > -1) {
                let newQuantity = cart.items[itemIndex].quantity + quantity;
                if (newQuantity > variantInInventory.quantity) {
                    throw createError.BadRequest('Cannot exceed available inventory quantity');
                }
                cart.items[itemIndex].quantity = newQuantity;
            } else {
                cart.items.push({ productId, inventoryId, quantity, variant });
            }

            await cart.save();
            res.status(200).json(cart);
        } catch (error) {
            next(error);
        }
    },

    async getCart(req, res, next) {
        try {
            const userId = req.payload.aud;
            console.log(`userId: ${userId}`);
            const cart = await Cart.findOne({ userId })
                                    .populate({
                                        path: 'items.productId',
                                        populate: {
                                            path: 'brandId',
                                            model: 'Brand'
                                        }
                                    });
    
            if (!cart) throw createError.NotFound('Cart not found');
            res.status(200).json(cart);
        } catch (error) {
            next(error);
        }
    },
    

    async removeFromCart(req, res, next) {
        try {
            const userId = req.payload.aud;
            const { productId, variant } = req.body; 
    
            const cart = await Cart.findOne({ userId });
            if (!cart) throw createError.NotFound('Cart not found');

            cart.items = cart.items.filter(item =>
                !(item.productId.toString() === productId &&
                  item.variant.color === variant.color &&
                  item.variant.size === variant.size)
            );
    
            await cart.save();
            res.status(200).json(cart);
        } catch (error) {
            next(error);
        }
    },
    

    async updateCartItem(req, res, next) {
        try {
            const userId = req.payload.aud;
            const { productId, inventoryId, quantity, variant } = req.body;
    
            if (quantity < 1) throw createError.BadRequest('Quantity must be at least 1');
    
            const cart = await Cart.findOne({ userId });
            if (!cart) throw createError.NotFound('Cart not found');
    
            const inventoryItem = await Inventory.findById(inventoryId);
            if (!inventoryItem) throw createError.NotFound('Inventory item not found');
    
            const itemIndex = cart.items.findIndex(item =>
                item.productId.toString() === productId &&
                item.variant.color === variant.color &&
                item.variant.size === variant.size
            );
    
            if (itemIndex === -1) throw createError.NotFound('Item not found in cart');
    
           
            const variantInInventory = inventoryItem.variants.find(v => 
                v.color === variant.color && v.size === variant.size
            );
    
            if (quantity > variantInInventory.quantity) {
                throw createError.BadRequest('Requested quantity exceeds available stock');
            }
    
            cart.items[itemIndex].quantity = quantity;
            await cart.save();
            res.status(200).json(cart);
        } catch (error) {
            next(error);
        }
    },
    

    async checkout(req, res, next) {
        try {
            const userId = req.payload.aud;
            const cart = await Cart.findOne({ userId });
            if (!cart || cart.items.length === 0) throw createError.BadRequest('Cart is empty');
    
            for (const item of cart.items) {
                const inventoryItem = await Inventory.findById(item.inventoryId);
                const variant = inventoryItem.variants.find(v =>
                    v.color === item.variant.color && v.size === item.variant.size);
    
                if (item.quantity > variant.quantity) {
                    throw createError.BadRequest(`Not enough stock for ${item.productId}`);
                }
    
                variant.quantity -= item.quantity;

            }
    
            await Promise.all(cart.items.map(item => Inventory.findById(item.inventoryId).save()));
    
            cart.items = [];
            await cart.save();

            res.status(200).json({ message: 'Checkout successful', cart });
        } catch (error) {
            next(error);
        }
    },
    
};

module.exports = CartController;
