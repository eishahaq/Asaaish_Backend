const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CategorySchema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true 
  },
  description: {
    type: String,
    required: false,
  },

});

const Category = mongoose.model('Category', CategorySchema);
module.exports = Category;
