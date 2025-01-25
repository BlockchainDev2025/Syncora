
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// add did as count
const transactionModel = new Schema({
    time: { type: String },
    fromAddress: { type: String },
    toAddress: { type: String },
    transactionHash: { type: String },
    transactionHash: { type: String },
})

module.exports = mongoose.model('transactionModel', transactionModel); 