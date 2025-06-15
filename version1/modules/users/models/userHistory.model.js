const mongoose = require('mongoose');

const userHistorySchema = new mongoose.Schema({
  userId: { type: String },
  content: { type: String },
  type: { type: String },
  prompt: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('UserHistory', userHistorySchema);