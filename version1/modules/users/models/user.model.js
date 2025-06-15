const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  emailId: { type: String, unique: true, required: true },
  password: { type: String },
  name: { type: String, default: '' },
  googleId: { type: String, unique: true, sparse: true },
  useCount: { type: Number, default: 0 },
  isUserVerified:{ type: Boolean,default:false }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);