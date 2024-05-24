const Tag = require('../Models/Tag');
const User = require('../Models/User');
const Category = require('../Models/Category'); 
const createError = require('http-errors');

const TagController = {
    async createTag(req, res, next) {
        try {
            const userId = req.payload.aud; 
            const user = await User.findById(userId);

            if (!['Admin', 'Vendor'].includes(user.role)) {
                return next(createError(403, "Only admins and vendors can create tags"));
            }

            const { name, parentCategory } = req.body; 
            if (parentCategory) {
                const categoryExists = await Category.findById(parentCategory);
                if (!categoryExists) {
                    return next(createError(404, "Parent category not found"));
                }
            }

            const tag = new Tag({
                name,
                parentCategory: parentCategory || null, 
            });
            const savedTag = await tag.save();
            res.status(201).json(savedTag);
        } catch (error) {
            next(createError(500, error.message));
        }
    },

    async getAllTags(req, res, next) {
        try {
            const tags = await Tag.find().populate('parentCategory');
            res.json(tags);
        } catch (error) {
            next(createError(500, error.message));
        }
    },

    async getTagById(req, res, next) {
        try {
            const tag = await Tag.findById(req.params.id).populate('parentCategory');
            if (!tag) {
                return next(createError(404, 'Tag not found'));
            }
            res.json(tag);
        } catch (error) {
            next(createError(500, error.message));
        }
    },

    
    async getTagsByParentCategory(req, res, next) {
        try {
            const parentCategoryId = req.params.parentCategoryId;
            if (!parentCategoryId) {
                return next(createError.BadRequest("Parent category ID is required"));
            }

            const tags = await Tag.find({ parentCategory: parentCategoryId });
            if (!tags.length) {
                return res.status(404).json({ message: 'No tags found for this category' });
            }

            res.status(200).json(tags);
        } catch (error) {
            next(createError.InternalServerError(error.message));
        }
    },

    async updateTag(req, res, next) {
        try {
            const userId = req.payload.aud;
            const user = await User.findById(userId);

            if (!['Admin', 'Vendor'].includes(user.role)) {
                return next(createError(403, "Only admins and vendors can update tags"));
            }

            if (req.body.parentCategory) {
                const categoryExists = await Category.findById(req.body.parentCategory);
                if (!categoryExists) {
                    return next(createError(404, "Parent category not found"));
                }
            }

            const updatedTag = await Tag.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate('parentCategory');
            if (!updatedTag) {
                return next(createError(404, 'Tag not found'));
            }
            res.json(updatedTag);
        } catch (error) {
            next(createError(500, error.message));
        }
    },

    async deleteTag(req, res, next) {
        try {
            const userId = req.payload.aud;
            const user = await User.findById(userId);

            if (!['Admin', 'Vendor'].includes(user.role)) {
                return next(createError(403, "Only admins and vendors can delete tags"));
            }

            const deletedTag = await Tag.findByIdAndDelete(req.params.id);
            if (!deletedTag) {
                return next(createError(404, 'Tag not found'));
            }
            res.json({ message: 'Tag successfully deleted' });
        } catch (error) {
            next(createError(500, error.message));
        }
    }
};

module.exports = TagController;
