const Category = require('../Models/Category'); // Adjust the path as needed
const User = require('../Models/User');
const createError = require('http-errors');

const CategoryController = {
    async createCategory(req, res, next) {
        try {
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
            next(error); 
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
