const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const brandSchema = new Schema({
    brandID: {
        type: String,
        required: true,
        unique: true
    },
    brandName: {
        type: String,
        required: true
    },
    stores: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Store'  // Reference to the Store model
        }
    ],
  description: {
    type: String
  },
  logoUrl:{
    type: String
  } 
});

const Brand = mongoose.model('Brand', brandSchema);

module.exports = Brand;
