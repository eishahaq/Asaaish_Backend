const createError = require('http-errors');
const Product = require('../Models/Product');

const CartController = {
    async validateProductAddition(req, res, next) {
        const { productId, cartProducts } = req.body;
    
        if (!productId) {
            return res.status(400).json({ message: "Product ID is required." });
        }
    
        try {
            const productToAdd = await Product.findById(productId);
            if (!productToAdd) {
                throw createError(404, "Product not found");
            }
    
            let isSameBrand = true;
            for (const cartProduct of cartProducts) {
                if (cartProduct.brandId.toString() !== productToAdd.brandId.toString()) {
                    isSameBrand = false;
                    break;
                }
            }
    
            if (isSameBrand) {
                return res.status(200).json({ 
                    message: "Product can be added to cart",
                    action: "add",
                    productBrandId: productToAdd.brandId 
                });
            } else {
                return res.status(200).json({ 
                    message: "Cart cleared and product added",
                    action: "clear_and_add",
                    productBrandId: productToAdd.brandId 
                });
            }
        } catch (error) {
            next(error);
        }
    },
    
    async validateProductRemoval(req, res) {
        const { productId } = req.body;

        if (!productId) {
            return res.status(400).json({ message: "Product ID is required for removal." });
        }

        try {
            const product = await Product.findById(productId);
            if (!product) {
                throw createError(404, "Product not found");
            }

            res.status(200).json({ message: "Product can be removed from cart" });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    async checkCartContents(req, res) {
        const { cart } = req.body;

        if (!cart || !Array.isArray(cart)) {
            return res.status(400).json({ message: "Invalid cart format." });
        }

        res.status(200).json({ message: "Cart contents received", cart });
    },

    clearCart(req, res) {
        res.status(200).json({ message: "Cart cleared" });
    }
}

module.exports = CartController;
