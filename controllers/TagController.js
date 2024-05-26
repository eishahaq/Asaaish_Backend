    const Tag = require('../Models/Tag');
    const User = require('../Models/User');
    const Category = require('../Models/Category'); // Make sure to require the Category model
    const createError = require('http-errors');

    const TagController = {
        async createTag(req, res, next) {
            try {
                const userId = req.payload.aud; // Assuming JWT middleware sets this
                const user = await User.findById(userId);

                if (!['Admin', 'Vendor'].includes(user.role)) {
                    return next(createError(403, "Only admins and vendors can create tags"));
                }

                const { name, parentCategory } = req.body; // Changed from parentTag to parentCategory

                // Additional check: Validate parentCategory exists if provided
                if (parentCategory) {
                    const categoryExists = await Category.findById(parentCategory);
                    if (!categoryExists) {
                        return next(createError(404, "Parent category not found"));
                    }
                }

                const tag = new Tag({
                    name,
                    parentCategory: parentCategory || null, // Changed from parentTag to parentCategory
                });
                const savedTag = await tag.save();
                res.status(201).json(savedTag);
            } catch (error) {
                next(createError(500, error.message));
            }
        },

        // No changes needed for getAllTags and getTagById
        async getAllTags(req, res, next) {
            try {
                // Changed to populate 'parentCategory' instead of 'parentTag'
                const tags = await Tag.find().populate('parentCategory');
                console.log(tags);
                res.json(tags);
            } catch (error) {
                next(createError(500, error.message));
            }
        },
        async getAllTagsName(req, res, next) {
            try {
                // Fetch all tags
                const tags = await Tag.find({}, 'name').lean();
                if (!tags || tags.length === 0) {
                    console.log("No tags found");
                    return res.status(404).json({ message: 'No tags found' });
                }
        
                // Extract tag names
                const tagNames = tags.map(tag => tag.name);
        
                res.status(200).json(tagNames);
            } catch (error) {
                console.error("Error fetching tags:", error);
                next(createError.InternalServerError(error.message));
            }    
        },

        
        async getTagById(req, res, next) {
            try {
                // Changed to populate 'parentCategory' instead of 'parentTag'
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

        // No changes needed for updateTag and deleteTag, assuming you're updating/deleting by tag ID
        async updateTag(req, res, next) {
            try {
                const userId = req.payload.aud;
                const user = await User.findById(userId);

                if (!['Admin', 'Vendor'].includes(user.role)) {
                    return next(createError(403, "Only admins and vendors can update tags"));
                }

                // Before updating, check if the new parentCategory exists if provided
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
            // Method remains the same as tags are deleted by their ID
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
