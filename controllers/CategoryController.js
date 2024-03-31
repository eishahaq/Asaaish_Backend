const Category = require('../Models/Category'); // Adjust the path as needed
const User = require('../Models/User');
const createError = require('http-errors');

const CategoryController = {
    async createCategory(req, res, next) {
        try {
            //const userId = req.payload.aud; // Make sure `req.payload` is correctly populated
            // const user = await User.findById(userId);
    
            // if (!user) {
            //     return next(createError(404, "User not found"));
            // }
    
            // if (!['Admin', 'Vendor'].includes(user.role)) {
            //     return next(createError(403, "Only admins and vendors can create categories"));
            // }
            console.log("im in api");
            const { name, description } = req.body;
            const categoryExists = await Category.findOne({ name });
    
            if (categoryExists) {
                return res.status(400).json({ message: "Category already exists." });
            }
    
            const category = new Category({
                name,
                description
            });
    
            const savedCategory = await category.save();
            res.status(201).json(savedCategory);
        } catch (error) {
            next(error); // Make sure your error handling middleware is properly set up to catch this
        }
    },    


    async getAllCategories(req, res, next) {
        try {
            const categories = await Category.find();
            res.json(categories);
        } catch (error) {
            next(createError(500, error.message));
        }
    },

    async getCategoryById(req, res, next) {
        try {
            const category = await Category.findById(req.params.id);
            if (!category) {
                return next(createError(404, 'Category not found'));
            }
            res.json(category);
        } catch (error) {
            next(createError(500, error.message));
        }
    },

    async updateCategory(req, res, next) {
        try {
            // const userId = req.payload.aud;
            // const user = await User.findById(userId);

            // if (!['Admin', 'Vendor'].includes(user.role)) {
            //     return next(createError(403, "Only admins and vendors can update categories"));
            // }

            const { name, description } = req.body;
            const updatedCategory = await Category.findByIdAndUpdate(req.params.id, { name, description }, { new: true });
            if (!updatedCategory) {
                return next(createError(404, 'Category not found'));
            }
            res.json(updatedCategory);
        } catch (error) {
            next(createError(500, error.message));
        }
    },

    async deleteCategory(req, res, next) {
        try {
            // const userId = req.payload.aud;
            // const user = await User.findById(userId);

            // if (!['Admin', 'Vendor'].includes(user.role)) {
            //     return next(createError(403, "Only admins and vendors can delete categories"));
            // }

            const deletedCategory = await Category.findByIdAndDelete(req.params.id);
            if (!deletedCategory) {
                return next(createError(404, 'Category not found'));
            }
            res.json({ message: 'Category successfully deleted' });
        } catch (error) {
            next(createError(500, error.message));
        }
    }
};

module.exports = CategoryController;
