const Brand = require('../Models/Brand');
const createError = require('http-errors');

const BrandController = {
    // Create a new brand
    async createBrand(req, res, next) {
        try {
            if (req.payload.role !== 'Admin') {
                throw createError.Forbidden("Only admins can create brands");
            }

            const { name, description, logoUrl } = req.body;
            const doesExist = await Brand.findOne({ name });
            if (doesExist) {
                throw createError.Conflict(`${name} is already registered`);
            }

            const brand = new Brand({ name, description, logoUrl });
            const savedBrand = await brand.save();
            res.status(201).json(savedBrand);
        } catch (error) {
            next(error);
        }
    },

    // Get all brands
    async getAllBrands(req, res, next) {
        try {
            const brands = await Brand.find({});
            res.status(200).json(brands);
        } catch (error) {
            next(error);
        }
    },

    // Get a single brand by ID
    async getBrandById(req, res, next) {
        try {
            const brandId = req.params.id;
            const brand = await Brand.findById(brandId);
            if (!brand) {
                throw createError.NotFound("Brand not found");
            }
            res.status(200).json(brand);
        } catch (error) {
            next(error);
        }
    },

    // Update a brand
    async updateBrand(req, res, next) {
        try {
            if (req.payload.role !== 'Admin') {
                throw createError.Forbidden("Only admins can update brands");
            }

            const brandId = req.params.id;
            const updates = req.body;
            const brand = await Brand.findByIdAndUpdate(brandId, updates, { new: true });
            if (!brand) {
                throw createError.NotFound("Brand not found");
            }
            res.status(200).json(brand);
        } catch (error) {
            next(error);
        }
    },

    // Delete a brand
    async deleteBrand(req, res, next) {
        try {
            if (req.payload.role !== 'Admin') {
                throw createError.Forbidden("Only admins can delete brands");
            }

            const brandId = req.params.id;
            const brand = await Brand.findByIdAndDelete(brandId);
            if (!brand) {
                throw createError.NotFound("Brand not found");
            }
            res.status(200).json({ message: "Brand successfully deleted" });
        } catch (error) {
            next(error);
        }
    }
};

module.exports = BrandController;
