const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CollectionSchema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  description: String,
  brand: { 
    type: Schema.Types.ObjectId, 
    ref: 'Brand',
    required: true
  },
  products: [{ 
    type: Schema.Types.ObjectId, 
    ref: 'Product',
    required: true
  }],
  images: [
    String
  ]
}, { timestamps: true });

const Collection = mongoose.model('Collection', CollectionSchema);
module.exports = Collection;
