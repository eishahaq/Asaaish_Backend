const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CategorySchema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true // Ensures category names are unique
  },
  parentCategory: {
    type: Schema.Types.ObjectId,
    ref: 'Category',
    default: null // This indicates a top-level category if null
  }
});

const Category = mongoose.model('Category', CategorySchema);
module.exports = Category;
