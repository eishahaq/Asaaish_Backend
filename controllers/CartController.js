// File: controllers/CartController.js
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
            const { productId, inventoryId, quantity, variant } = req.body;
            console.log(`product id ${productId} inventory id ${inventoryId} quantity ${quantity} variant ${variant.color} ${variant.size}`);    

            // Check inventory availability
            const inventoryItem = await Inventory.findById(inventoryId);
            if (!inventoryItem) throw createError.NotFound('Inventory item not found');
            console.log("inv exits" + inventoryItem);

            const variantInInventory = inventoryItem.variants.find(v => 
                v.color === variant.color && v.size === variant.size
            );
            console.log("variant exits" + variantInInventory);

            if (!variantInInventory || variantInInventory.quantity < quantity) {
                throw createError.BadRequest('Requested quantity exceeds available stock');
            }

            let cart = await Cart.findOne({ userId });
            if (!cart) {
                console.log("no cart");
                cart = new Cart({ userId, items: [] });
            }
            console.log("cart "+ cart);
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

     async addToCartClosest (req, res, next){
        try {
            const userId = req.payload.aud;
            const { productId, storeId, quantity, variant } = req.body;
    
            // Validate the inventory availability for the given variant and store
            const inventory = await Inventory.findOne({ storeId: storeId, productId: productId });
            if (!inventory) {
                return res.status(404).json({ message: 'Inventory item not found' });
            }
    
            const variantInInventory = inventory.variants.find(v => 
                v.color === variant.color && v.size === variant.size);
    
            if (!variantInInventory || variantInInventory.quantity < quantity) {
                return res.status(401).json({ message: 'Requested quantity exceeds available stock' });
            }
    
            let cart = await Cart.findOne({ userId });
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
                    return res.status(400).json({ message: 'Cannot exceed available inventory quantity' });
                }
                cart.items[itemIndex].quantity = newQuantity;
            } else {
                cart.items.push({ productId, inventoryId: inventory._id, quantity, variant });
            }
    
            await cart.save();
            res.status(200).json(cart);
        } catch (error) {
            next(error);
        }},

    async getCart(req, res, next) {
        try {
            const userId = req.payload.aud;
            console.log("imhere"+ userId);
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

    async clearCart(req, res, next) {
        try {
          const userId = req.payload.aud;
          let cart = await Cart.findOne({ userId });
    
          if (!cart) {
            return res.status(404).json({ message: 'Cart not found' });
          }
    
          cart.items = [];
          await cart.save();
    
          res.status(200).json({ message: 'Cart cleared successfully' });
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
