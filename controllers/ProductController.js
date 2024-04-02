// const Product = require('../Models/Product');
// const Category = require('../Models/Tag');
// const User = require('../Models/User');
// const createError = require('http-errors');

// const ProductController = {
//     async createProduct(req, res, next) {
//         try {
//             const userId = req.payload.aud; // Assuming your authentication middleware sets this
//             const user = await User.findById(userId);

//             if (!['Admin', 'Vendor'].includes(user.role)) {
//                 return next(createError.Forbidden("Only admins and vendors can create products"));
//             }

//             const { brandId, name, description, categories, price, images, offers } = req.body;

//             // Validate categories
//             for (let categoryId of categories) {
//                 const categoryExists = await Category.findById(categoryId);
//                 if (!categoryExists) {
//                     return next(createError.BadRequest(`Category with ID ${categoryId} does not exist`));
//                 }
//             }

//             const product = new Product({
//                 brandId,
//                 name,
//                 description,
//                 categories,
//                 price,
//                 images,
//                 offers
//             });
//             await product.save();
//             res.status(201).json(product);
//         } catch (error) {
//             next(createError.InternalServerError(error.message));
//         }
//     },

//     async getAllProducts(req, res, next) {
//         try {
//             const products = await Product.find().populate('brandId').populate('categories');
//             res.status(200).json(products);
//         } catch (error) {
//             next(createError.InternalServerError(error.message));
//         }
//     },

//     async getProductById(req, res, next) {
//         try {
//             const product = await Product.findById(req.params.id).populate('brandId').populate('categories');
//             if (!product) return next(createError.NotFound('Product not found'));
//             res.status(200).json(product);
//         } catch (error) {
//             next(createError.InternalServerError(error.message));
//         }
//     },

//     async getProductsByBrand(req, res, next) {
//         try {
//             const { brandId } = req.params;
//             const products = await Product.find({ brandId }).populate('brandId').populate('categories');
//             if (!products.length) return res.status(200).json([]);
//             res.status(200).json(products);
//         } catch (error) {
//             next(createError.InternalServerError(error.message));
//         }
//     },

//     async updateProduct(req, res, next) {
//         try {
//             const userId = req.payload.aud;
//             const user = await User.findById(userId);

//             if (user.role === 'Customer') {
//                 return next(createError.Forbidden("Only admins and vendors can update products"));
//             }

//             const updatedProduct = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate('categories');
//             if (!updatedProduct) return next(createError.NotFound('Product not found'));
//             res.status(200).json(updatedProduct);
//         } catch (error) {
//             next(createError.InternalServerError(error.message));
//         }
//     },

//     async deleteProduct(req, res, next) {
//         try {
//             const userId = req.payload.aud;
//             const user = await User.findById(userId);

//             if (user.role === 'Customer') {
//                 return next(createError.Forbidden("Only admins and vendors can delete products"));
//             }

//             const deletedProduct = await Product.findByIdAndDelete(req.params.id);
//             if (!deletedProduct) return next(createError.NotFound('Product not found'));
//             res.status(200).json({ message: 'Product successfully deleted' });
//         } catch (error) {
//             next(createError.InternalServerError(error.message));
//         }
//     }
// };

// module.exports = ProductController;

const Product = require('../Models/Product');
const Category = require('../Models/Category'); // Corrected require statement
const Tag = require('../Models/Tag'); // Add Tag model
const User = require('../Models/User');
const createError = require('http-errors');
const Vendor = require('../Models/Vendor');
const user = require('../Models/User');

const ProductController = {
    async createProduct(req, res, next) {
        try {
            const userId = req.payload.aud; // Assuming your authentication middleware sets this
            const user = await User.findById(userId);

            if (!['Admin', 'Vendor'].includes(user.role)) {
                return next(createError.Forbidden("Only admins and vendors can create products"));
            }

            const { brandId, name, description, category, tags, price, images, offers } = req.body;

            // Validate the category
            const categoryExists = await Category.findById(category);
            if (!categoryExists) {
                return next(createError.BadRequest(`Category with ID ${category} does not exist`));
            }

            // Validate tags
            for (let tagId of tags) {
                const tagExists = await Tag.findById(tagId);
                if (!tagExists) {
                    return next(createError.BadRequest(`Tag with ID ${tagId} does not exist`));
                }
            }

            const product = new Product({
                brandId,
                name,
                description,
                category, // Updated to singular category
                tags, // Added tags
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

    // Updated to include 'tags' in populate methods
    async getAllProducts(req, res, next) {
        try {
            const products = await Product.find().populate('brandId').populate('category').populate('tags');
            res.status(200).json(products);
        } catch (error) {
            next(createError.InternalServerError(error.message));
        }
    },
    
    
    async getProductsByVendor(req, res, next) {
        try {
            const userId = req.payload.aud; // Vendor identification

            if (user.role === 'Customer') {
                throw createError.Forbidden("Only admins and vendors can access this");
            }            
            const vendor = await Vendor.findOne({user: user._id});
            const brandIdd = await Vendor.findOne({user: user._id}).populate('brand'); // Fetch brand IDs for this vendor
            console.log(brandIdd);
            console.log("vendor: " + vendor);
            if (!brandIdd) {
                
                return next(createError.NotFound('No brand found for this vendor'));
            }
    
            const products = await Product.find({ brandId: brandIdd.brand._id }).populate('brandId');
            res.status(200).json(products);
        } catch (error) {
            next(createError.InternalServerError(error.message));
        }
    },

    // Updated to include 'tags' in populate methods
    async getProductById(req, res, next) {
        try {
            const product = await Product.findById(req.params.id).populate('brandId').populate('category').populate('tags');
            if (!product) return next(createError.NotFound('Product not found'));
            res.status(200).json(product);
        } catch (error) {
            next(createError.InternalServerError(error.message));
        }
    },

    // Updated to include 'tags' in populate methods
    async getProductsByBrand(req, res, next) {
        try {
            const { brandId } = req.params;
            const products = await Product.find({ brandId }).populate('brandId').populate('category').populate('tags');
            if (!products.length) return res.status(200).json([]);
            res.status(200).json(products);
        } catch (error) {
            next(createError.InternalServerError(error.message));
        }
    },

    // Updated to handle tag addition/removal and populate 'tags'
    async updateProduct(req, res, next) {
        try {
            const userId = req.payload.aud;
            const user = await User.findById(userId);

            if (user.role === 'Customer') {
                return next(createError.Forbidden("Only admins and vendors can update products"));
            }

            // For adding/removing tags, you could handle this separately with $addToSet/$pull
            // Here we simply overwrite the product document with the provided fields
            const updatedProduct = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true })
                .populate('category')
                .populate('tags');
            if (!updatedProduct) return next(createError.NotFound('Product not found'));
            res.status(200).json(updatedProduct);
        } catch (error) {
            next(createError.InternalServerError(error.message));
        }
    },

    // Method remains unchanged
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
