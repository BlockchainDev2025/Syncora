const axios = require('axios');
const HostURL = require("../config/config.json");
const newUserModel = require('../models/userModel');
const jwt = require('jsonwebtoken');
const { Connection, PublicKey } = require('@solana/web3.js');
const connection = new Connection('https://api.devnet.solana.com', 'confirmed');

async function addAccount(req,res){
    try {
        
        // Create a new Account instance
        const newAccount = new newUserModel();

        // Optional: format the date (using ISO format)
        newAccount.date = new Date().toISOString();  // Set current date in ISO format
        newAccount.userId = req.body.userId;
        newAccount.userAddress = req.body.userAddress;
        newAccount.userDataObjects = req.body.userDataObjects;

        // Save the new account to the database and return the result
        await newAccount.save();
        res.send({ status: true, result: "Data Updated" });
        
    } catch (err) {
        res.send({ "error": err.message });
    }
};


/**
 * Get account(s) based on a filter
 * @param {Object} filter - The filter to apply (e.g. { userId: '123' })
 * @returns {Promise} - The result of the find operation
 */
async function getAccount(req,res){
    try {
        const accounts = await newUserModel.find({userId : req.query.userId});
        res.send(accounts);
    } catch (err) {
        res.send({ "error": err.message });
    }
};

/**
 * Fetch transaction details from Solana Devnet
 * @param {string} transactionSignature - The signature of the transaction to fetch
 */
async function getTransactionDetails(req,res) {
    try {
            const accounts = await newUserModel.find({userId : req.query.userId});
            const address = accounts[0].userAddress; // Replace with the Solana address
            const numTx = 100;
            const pubKey = new PublicKey(address);
            let transactionList = await connection.getSignaturesForAddress(pubKey, {limit:numTx});
            res.send({transactions: transactionList, userData: accounts});
    } catch (error) {
        console.error('Error fetching transactions:', error);
    }
}





module.exports = {
    addAccount,
    getAccount,
    getTransactionDetails
};