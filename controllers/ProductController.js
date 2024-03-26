const Product = require('../Models/Product'); 
const createError = require('http-errors');

const ProductController = {
    // Create a new product
    async createProduct(req, res, next) {
        try {
            if (req.payload.role !== 'Admin' && req.payload.role !== 'Vendor') {
                throw createError.Forbidden("Only admins and vendors can create products");
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

    // Update a product
    async updateProduct(req, res, next) {
        try {
            if (req.payload.role !== 'Admin' && req.payload.role !== 'Vendor') {
                throw createError.Forbidden("Only admins and vendors can update products");
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
            if (req.payload.role !== 'Admin' && req.payload.role !== 'Vendor') {
                throw createError.Forbidden("Only admins and vendors can delete products");
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
