const HostURL = require("../config/config.json");
const newUserModel = require('../models/userModel');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const { Connection, PublicKey,
    Keypair,
    Transaction,
    SystemProgram,
    sendAndConfirmTransaction } = require('@solana/web3.js');
const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
const bs58 = require('bs58');
// const {Program} = require("@project-serum/anchor");
// const AnchorProvider = require("@project-serum/anchor");
const idl = require("../idl/setget.json");
const { Buffer } = require("buffer");
const SEEDS = Buffer.from("json");
const programID = new PublicKey(idl.metadata.address);
const { Program, AnchorProvider, BN, Wallet } = require("@project-serum/anchor");
const anchor = require("@project-serum/anchor");
const { clusterApiUrl } = require("@solana/web3.js");



async function addAccount(req, res) {
    try {

        // Create a new Account instance
        const newAccount = new newUserModel();

        // Optional: format the date (using ISO format)
        newAccount.date = new Date().toISOString();  // Set current date in ISO format
        newAccount.userId = req.body.userId;
        newAccount.userAddress = req.body.userAddress;
        newAccount.userDataObjects = req.body.userDataObjects;
        newAccount.enteries = 1;

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
        var userData = await newUserModel.findOne({ userId: req.query.userId });
        let transactionList = userData.userDataObjects;

        function paginateArray(data, pageSize) {
            const paginatedResult = {};

            for (let i = 0; i < data.length; i += pageSize) {
                const pageNumber = (i / pageSize) + 1;
                paginatedResult[pageNumber] = data.slice(i, i + pageSize);
            }

            return paginatedResult;
        }
        const paginatedData = paginateArray(transactionList, 10);

        res.send({ status: true, transactions: paginatedData });
    } catch (error) {
        console.error('Error fetching transactions:', error);
    }
}


async function solanaTransaction(req, res) {

    try {
        var userData = await newUserModel.findOne({ userId: req.body.userId });
        let transactionList = await userData.userDataObjects;

        const uniqueId = await userData.enteries;
        const jsonData = await JSON.stringify(req.body.userDataObjects);
        const walletAddress = await req.body.walletAddress; //"ttfHNxjfV8CANajod3gLu4xqLYog3tcP926VbPs6MGf";

        if (!uniqueId || !jsonData || !walletAddress) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        const privateKeyBuffer = bs58.decode(req.body.pk)  //54Avr7f2J8Zfb3QsNh1aWozuLtTRGZGQYsCJXkhbVyEBjvN7786bfk9h3FrxswPyNjddEUd3aJVYv7CevbaWAmJf
        const walletKeypair = Keypair.fromSecretKey(Buffer.from(privateKeyBuffer));
        const walletPublicKey = walletKeypair.publicKey;
        const provider = new AnchorProvider(connection, new Wallet(walletKeypair), {
            preflightCommitment: "processed",
        });

        const program = new Program(idl, programID, provider);

        const [json_pda] = anchor.web3.PublicKey.findProgramAddressSync(
            [SEEDS, new BN(uniqueId).toArrayLike(Buffer, "le", 8), walletPublicKey.toBuffer()],
            program.programId
        );

        const transaction = await program.methods.writeJsonData(new BN(uniqueId), jsonData).accounts({
            owner: walletPublicKey,
            journalEntry: json_pda,
            systemProgram: SystemProgram.programId
        }).transaction();
        let blockhash = (await connection.getLatestBlockhash('finalized')).blockhash;
        transaction.recentBlockhash = blockhash;
        transaction.sign(walletKeypair);
        const txSignature = await provider.sendAndConfirm(transaction, [walletKeypair]);
        const transactionData = await connection.getTransaction(txSignature);
        const timestampp = transactionData.blockTime;
        if (req.body.userDataObjects) {
            var inputJSON = req.body.userDataObjects;
            var finalObj = {
                from : req.body.walletAddress,
                timestamp : timestampp ,
                transactionHash: txSignature,
                metaData: inputJSON,
                status: true
            };
            await userData.userDataObjects.push(finalObj);
            await newUserModel.findOneAndUpdate({ userId: req.body.userId, enteries: userData.enteries + 1 });
            await newUserModel.findOneAndUpdate({ userId: req.body.userId },{userDataObjects : userData.userDataObjects});
        }

        return res.json({ message: "Data stored successfully!", transaction: transactionData });
    } catch (err) {
        console.error("Error:", err);
        return res.status(500).json({ error: "Failed to store data" });
    }
}

async function updatePhantomTransaction(req, res) {

    try {
        var userData = await newUserModel.findOne({ userId: req.body.userId });
        if (req.body.walletAddress && req.body.timestamp && req.body.transactionHash && req.body.inputJSON) {
            var finalObj = {
                from : req.body.walletAddress,
                timestamp : req.body.timestamp ,
                transactionHash: req.body.transactionHash,
                metaData: req.body.inputJSON,
                status: true
            };
            await newUserModel.findOneAndUpdate({ userId: req.body.userId, enteries: userData.enteries + 1 });
            await newUserModel.findOneAndUpdate({ userId: req.body.userId },{userDataObjects : finalObj});
            return res.json({ status : true, message: "Data stored successfully!", transaction: finalObj });
        }
        else{
            return res.json({ status : false, message: "Missing required fields"});
        }

    } catch (err) {
        console.error("Error:", err);
        return res.status(500).json({ error: "Failed to store data" });
    }
}
async function addPointsBySyncora(req, res) {
    try {
        var userData = await newUserModel.findOne({ userId: req.body.userId });
        let transactionList = await userData.userDataObjects;

        const uniqueId = await userData.enteries;
        const jsonData = await JSON.stringify(req.body.userDataObjects);
        const walletAddress = await req.body.walletAddress; //"ttfHNxjfV8CANajod3gLu4xqLYog3tcP926VbPs6MGf";

        if (!uniqueId || !jsonData || !walletAddress) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        const privateKeyBuffer = bs58.decode(req.body.pk)  //54Avr7f2J8Zfb3QsNh1aWozuLtTRGZGQYsCJXkhbVyEBjvN7786bfk9h3FrxswPyNjddEUd3aJVYv7CevbaWAmJf
        const walletKeypair = Keypair.fromSecretKey(Buffer.from(privateKeyBuffer));
        const walletPublicKey = walletKeypair.publicKey;
        const provider = new AnchorProvider(connection, new Wallet(walletKeypair), {
            preflightCommitment: "processed",
        });

        const program = new Program(idl, programID, provider);

        const [json_pda] = anchor.web3.PublicKey.findProgramAddressSync(
            [SEEDS, new BN(uniqueId).toArrayLike(Buffer, "le", 8), walletPublicKey.toBuffer()],
            program.programId
        );

        const transaction = await program.methods.writeJsonData(new BN(uniqueId), jsonData).accounts({
            owner: walletPublicKey,
            journalEntry: json_pda,
            systemProgram: SystemProgram.programId
        }).transaction();
        let blockhash = (await connection.getLatestBlockhash('finalized')).blockhash;
        transaction.recentBlockhash = blockhash;
        transaction.sign(walletKeypair);
        const txSignature = await provider.sendAndConfirm(transaction, [walletKeypair]);
        const transactionData = await connection.getTransaction(txSignature);
        const timestampp = transactionData.blockTime;
        if (req.body.userDataObjects) {
            var inputJSON = req.body.userDataObjects;
            var finalObj = {
                from : req.body.receiverAddress,
                timestamp : timestampp ,
                transactionHash: txSignature,
                metaData: inputJSON,
                status: true
            };
            await userData.userDataObjects.push(finalObj);
            await newUserModel.findOneAndUpdate({ userId: req.body.userId, enteries: userData.enteries + 1 });
            await newUserModel.findOneAndUpdate({ userId: req.body.userId },{userDataObjects : userData.userDataObjects});
        }

        return res.json({ message: "Data stored successfully!", transaction: transactionData });
    } catch (err) {
        console.error("Error:", err);
        return res.status(500).json({ error: "Failed to store data" });
    }

}

async function getData(req, res) {
    try {
        const walletAddress = req.query.address;
        const uniqueId = new BN('1');
        if (!uniqueId || !walletAddress) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        const walletPublicKey = new PublicKey(walletAddress);
        const provider = new AnchorProvider(connection, null, {
            preflightCommitment: "processed",
        });

        const program = new Program(idl, programID, provider);

        const [json_pda] = anchor.web3.PublicKey.findProgramAddressSync(
            [SEEDS, new anchor.BN(uniqueId).toArrayLike(Buffer, "le", 8), walletPublicKey.toBuffer()],
            program.programId
        );
        console.log(json_pda)

        const account = await program.account.journalEntry.fetch(json_pda);
        let parsedContent;

        try {
            parsedContent = JSON.parse(account.content);
        } catch (e) {
            parsedContent = account.content;
        }

        return res.json({
            ...account,
            owner: account.owner.toBase58(),
            uniqueId: account.uniqueId.toString(),
            content: parsedContent,
        });
    } catch (err) {
        console.error("Error:", err);
        return res.status(500).json({ error: "Failed to fetch data" });
    }
};





module.exports = {
    addAccount,
    getAccount, 
    getTransactionDetails,
    solanaTransaction,
    getData,
    updatePhantomTransaction,
    addPointsBySyncora
};