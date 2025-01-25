const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// add did as count
const newAccount = new Schema({
    userId: { type: String },
    userAddress: { type: String },
    date: { type: String },
    userDataObjects: { type: Object }
})

module.exports = mongoose.model('newAccount', newAccount); 