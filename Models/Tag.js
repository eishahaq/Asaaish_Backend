const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const TagSchema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true, // Ensures tag names are unique
  },
  parentCategory: { // Renamed from parentTag to parentCategory
    type: Schema.Types.ObjectId,
    ref: 'Category', // Referencing Category collection
    default: null // Indicates a tag may not have a parent category
  }
});

const Tag = mongoose.model('Tag', TagSchema);
module.exports = Tag;
