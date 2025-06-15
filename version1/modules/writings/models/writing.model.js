const mongoose = require('mongoose');
const {userWritingTypes} =require("./../../../../utils/constant")
const userHistorySchema = new mongoose.Schema({
  userId: { type: String },
  content: { type: String },
  type: { type: String,enum:userWritingTypes},
  isPrivate:{type:Boolean,default:true},
  likeCount:{type:Number,default:0},
}, { timestamps: true });

module.exports = mongoose.model('userWritings', userHistorySchema);