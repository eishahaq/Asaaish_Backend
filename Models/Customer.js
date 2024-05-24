const mongoose = require('mongoose')
const Schema = mongoose.Schema 

const CustomerSchema = new Schema({
    user: { 
        type: Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    location: {
        type: { type: String, enum: ['Point'], default: 'Point' },
        coordinates: {
            type: [Number],
            index: '2dsphere'
        }
    },
    address: String,
},
{ timestamps: true });

const customer = mongoose.model('Customer', CustomerSchema)
module.exports = customer