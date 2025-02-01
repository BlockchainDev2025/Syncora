const axios = require('axios');
const HostURL = require("../config/config.json");
const newUserModel = require('../models/userModel');
const jwt = require('jsonwebtoken');
const { Connection, PublicKey,
    Keypair,
    Transaction,
    SystemProgram,
    sendAndConfirmTransaction } = require('@solana/web3.js');
const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
const bs58 = require('bs58');

async function addAccount(req, res) {
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
async function getAccount(req, res) {
    try {
        const accounts = await newUserModel.find({ userId: req.query.userId });
        res.send(accounts);
    } catch (err) {
        res.send({ "error": err.message });
    }
};

/**
 * Fetch transaction details from Solana Devnet
 * @param {string} transactionSignature - The signature of the transaction to fetch
 */
async function getTransactionDetails(req, res) {
    try {
        const accounts = await newUserModel.find({ userId: req.query.userId });
        const address = accounts[0].userAddress; // Replace with the Solana address
        const numTx = 100;
        const pubKey = new PublicKey(address);
        let transactionList = await connection.getSignaturesForAddress(pubKey, { limit: numTx });
        res.send({ transactions: transactionList, userData: accounts });
    } catch (error) {
        console.error('Error fetching transactions:', error);
    }
}


async function solanaTransaction(req, res) {


    var userData = await newUserModel.findOne({ userId: req.body.userId });

    // Check if user exists
    if (!userData) {
        res.send({ status: false, message: 'User not found' });
    }
    else {
            await userData.userDataObjects.push(req.body.userDataObjects);
            await newUserModel.findOneAndUpdate({ userId: req.body.userId },{userDataObjects : userData.userDataObjects});

            // Your deployed program ID
            const programId = new PublicKey('3KjFjeSdLuiLQi7utSfuhjHdXES7wkHCTWA76m1rUyPt'); // Replace with your program's actual ID

            // Sender keypair (e.g., the wallet you're using)
            const senderKeypair = await Keypair.fromSecretKey(bs58.decode('54Avr7f2J8Zfb3QsNh1aWozuLtTRGZGQYsCJXkhbVyEBjvN7786bfk9h3FrxswPyNjddEUd3aJVYv7CevbaWAmJf'));

            const transaction = await new Transaction();

            // Set up the instruction to call 'use_constants'
            const instructionData = await Buffer.alloc(8);  // The data passed to the program; empty here as 'use_constants' has no arguments

            const instruction = {
                programId: programId, // The program you want to call
                keys: [
                    { pubkey: senderKeypair.publicKey, isSigner: true, isWritable: false },
                ],
                data: instructionData, // Empty data since the function has no parameters
            };

            // Add the instruction to the transaction
            await transaction.add(instruction);

            // Send the transaction
            try {
                // Sign and send the transaction
                const signature = await sendAndConfirmTransaction(connection, transaction, [senderKeypair]);
                res.send({ status: true, hash: programId });
            } catch (errorTransactio) {
                res.send({ status: true, hash: programId })
            }
        }
    }





    module.exports = {
        addAccount,
        getAccount,
        getTransactionDetails,
        solanaTransaction
    };