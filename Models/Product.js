const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const productSchema = new Schema({
    productBarcode: {
        type: String, 
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    color: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true
    },
    collectionName: {
        type: String, 
    },
    discount: {
        type: Number,
        default: 0, 
        min: 0,
        max: 100
    },
    size: {
        type: String,
        required: true
    },
    imageUrl: {
        type: String,
        required: true
    }
});

const Product = mongoose.model('Product', productSchema);

module.exports = Product;

//multiple images
//size chart
//Offers array (name, desc, valid till)
//remove size and colors