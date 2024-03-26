const Product = require('../Models/Product');
const Category = require('../Models/Category');
const User = require('../Models/User');
const createError = require('http-errors');

const ProductController = {
    async createProduct(req, res, next) {
        try {
            const userId = req.payload.aud; // Assuming your authentication middleware sets this
            const user = await User.findById(userId);

            if (!['Admin', 'Vendor'].includes(user.role)) {
                return next(createError.Forbidden("Only admins and vendors can create products"));
            }

            const { brandId, name, description, categories, price, images, offers } = req.body;

            // Validate categories
            for (let categoryId of categories) {
                const categoryExists = await Category.findById(categoryId);
                if (!categoryExists) {
                    return next(createError.BadRequest(`Category with ID ${categoryId} does not exist`));
                }
            }

            const product = new Product({
                brandId,
                name,
                description,
                categories,
                price,
                images,
                offers
            });
            await product.save();
            res.status(201).json(product);
        } catch (error) {
            next(createError.InternalServerError(error.message));
        }
    },

    async getAllProducts(req, res, next) {
        try {
            const products = await Product.find().populate('brandId').populate('categories');
            res.status(200).json(products);
        } catch (error) {
            next(createError.InternalServerError(error.message));
        }
    },

    async getProductById(req, res, next) {
        try {
            const product = await Product.findById(req.params.id).populate('brandId').populate('categories');
            if (!product) return next(createError.NotFound('Product not found'));
            res.status(200).json(product);
        } catch (error) {
            next(createError.InternalServerError(error.message));
        }
    },

    async getProductsByBrand(req, res, next) {
        try {
            const { brandId } = req.params;
            const products = await Product.find({ brandId }).populate('brandId').populate('categories');
            if (!products.length) return res.status(200).json([]);
            res.status(200).json(products);
        } catch (error) {
            next(createError.InternalServerError(error.message));
        }
    },

    async updateProduct(req, res, next) {
        try {
            const userId = req.payload.aud;
            const user = await User.findById(userId);

            if (user.role === 'Customer') {
                return next(createError.Forbidden("Only admins and vendors can update products"));
            }

            const updatedProduct = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate('categories');
            if (!updatedProduct) return next(createError.NotFound('Product not found'));
            res.status(200).json(updatedProduct);
        } catch (error) {
            next(createError.InternalServerError(error.message));
        }
    },

    async deleteProduct(req, res, next) {
        try {
            const userId = req.payload.aud;
            const user = await User.findById(userId);

            if (user.role === 'Customer') {
                return next(createError.Forbidden("Only admins and vendors can delete products"));
            }

            const deletedProduct = await Product.findByIdAndDelete(req.params.id);
            if (!deletedProduct) return next(createError.NotFound('Product not found'));
            res.status(200).json({ message: 'Product successfully deleted' });
        } catch (error) {
            next(createError.InternalServerError(error.message));
        }
    }
};

module.exports = ProductController;
