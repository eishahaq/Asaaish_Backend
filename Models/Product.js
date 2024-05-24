const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ProductSchema = new Schema({
  brandId: {
    type: Schema.Types.ObjectId,
    ref: 'Brand',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  category: { 
    type: Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  tags: [{ 
    type: Schema.Types.ObjectId,
    ref: 'Tag'
  }],
  price: {
    type: Number,
    required: true
  },
  images: [String],
  offers: {
    discountPercentage: Number,
    description: String,
    validUntil: Date
  }
});

const Product = mongoose.model('Product', ProductSchema);
module.exports = Product;
