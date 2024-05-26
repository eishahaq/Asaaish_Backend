// FCMModel.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const FCMTokenSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User' },
  token: { type: String, required: true },
});

module.exports = mongoose.model('FCMToken', FCMTokenSchema);
