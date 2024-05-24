const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const TagSchema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true, 
  },
  parentCategory: {
    type: Schema.Types.ObjectId,
    ref: 'Category', 
    default: null 
  }
});

const Tag = mongoose.model('Tag', TagSchema);
module.exports = Tag;
