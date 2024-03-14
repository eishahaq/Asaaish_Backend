const Product = require('../Models/Product'); 
const createError = require('http-errors');
const User = require('../Models/User');

const ProductController = {

    async createProduct(req, res, next) {
        try {
            const userId = req.payload.aud;
            const user = await User.findById(userId);
    
            if (user.role === 'Customer') {
                throw createError.Forbidden("Only admins and vendors can create the products");
            }

            const { brandId, name, description, category, price, images, offers } = req.body;
            const product = new Product({
                brandId,
                name,
                description,
                category,
                price,
                images,
                offers
            });
            await product.save();
            res.status(201).json(product);
        } catch (error) {
            res.send({
                error: {
                    status: error.status || 500,
                    message: error.message,
                },
            });
            console.log(error.message);
            next(error);
        }
    },

    // Fetch all products
    async getAllProducts(req, res, next) {
        try {
            const products = await Product.find().populate('brandId');
            res.status(200).json(products);
        } catch (error) {
            next(error);
        }
    },

    // Fetch a single product by ID
    async getProductById(req, res, next) {
        try {
            const product = await Product.findById(req.params.id).populate('brandId');
            if (!product) throw createError.NotFound('Product not found');
            res.status(200).json(product);
        } catch (error) {
            next(error);
        }
    },

    async getProductsByBrand(req, res, next) {
        try {
            const brandId = req.params.brandId; // Assuming the brandId is passed as a URL parameter
            console.log("prodbybrand" +brandId);
            const products = await Product.find({ brandId: brandId }).populate('brandId');
            console.log(products.length);
            if (products.length === 0) {
                console.log("zero products")
                throw createError.NotFound('No products found for the specified brand');
            
            }
            
            res.status(200).json(products);
        } catch (error) {
            next(error);
        }
    },
    // Update a product
    async updateProduct(req, res, next) {
        try {
            const userId = req.payload.aud;
            const user = await User.findById(userId);
    
            if (user.role === 'Customer') {
                throw createError.Forbidden("Only admins and vendors can update the products");
            }
            const updatedProduct = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
            if (!updatedProduct) throw createError.NotFound('Product not found');
            res.status(200).json(updatedProduct);
        } catch (error) {
            next(error);
        }
    },

    // Delete a product
    async deleteProduct(req, res, next) {
        try {
            const userId = req.payload.aud;
            const user = await User.findById(userId);
    
            if (user.role === 'Customer') {
                throw createError.Forbidden("Only admins and vendors can delete the products");
            }
            const deletedProduct = await Product.findByIdAndDelete(req.params.id);
            if (!deletedProduct) throw createError.NotFound('Product not found');
            res.status(200).json({ message: 'Product successfully deleted' });
        } catch (error) {
            next(error);
        }
    }
};

module.exports = ProductController;