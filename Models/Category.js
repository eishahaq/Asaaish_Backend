// File: models/Category.js

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CategorySchema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true // Ensures category names are unique
  },
  description: {
    type: String,
    required: false,
  },

});

const Category = mongoose.model('Category', CategorySchema);
module.exports = Category;
