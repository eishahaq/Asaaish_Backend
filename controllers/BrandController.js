const Brand = require('../Models/Brand'); // Adjust the path as necessary
const createError = require('http-errors');

const BrandController = {
    // Create a new brand
   async createBrand(req, res, next) {
        try {
            const { name, description, logoUrl } = req.body;
            if (!name) throw createError.BadRequest('Brand name is required');
            const doesExist = await Brand.findOne({ name: name });
            if (doesExist) throw createError.Conflict(`${name} is already registered as a brand`);

            const brand = new Brand({
                name,
                description,
                logoUrl
            });
            const savedBrand = await brand.save();
            res.status(201).json(savedBrand);
        } catch (error) {
            next(error);
        }
    },

    // Fetch all brands
    async getAllBrands(req, res, next) {
        try {
            const brands = await Brand.find();
            res.status(200).json(brands);
        } catch (error) {
            next(error);
        }
    },

    // Fetch a single brand by ID
    async getBrandById(req, res, next) {
        try {
            const brand = await Brand.findById(req.params.id);
            if (!brand) throw createError.NotFound('Brand not found');
            res.status(200).json(brand);
        } catch (error) {
            next(error);
        }
    },

    // Update a brand
    async updateBrand(req, res, next) {
        try {
            const updatedBrand = await Brand.findByIdAndUpdate(req.params.id, req.body, { new: true });
            if (!updatedBrand) throw createError.NotFound('Brand not found');
            res.status(200).json(updatedBrand);
        } catch (error) {
            next(error);
        }
    },

    // Delete a brand
    async deleteBrand(req, res, next) {
        try {
            const deletedBrand = await Brand.findByIdAndDelete(req.params.id);
            if (!deletedBrand) throw createError.NotFound('Brand not found');
            res.status(200).json({ message: 'Brand successfully deleted' });
        } catch (error) {
            next(error);
        }
    }
};

module.exports = BrandController;
