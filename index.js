
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const logger = require('morgan');
const route = require('./routes/ethDID');
const app = express();
const SWAGGER = require("./ethDID-swagger.json");
const swaggerUI = require("swagger-ui-express");
const mongoose = require('mongoose');
const MongoClient = require('mongodb').MongoClient;

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/api/', route);
app.use(express.json());
app.use("/api-docs", swaggerUI.serve, swaggerUI.setup(SWAGGER));

//MongoDB connection
mongoose.connect('mongodb://127.0.0.1:27017/syncoraData',
    { useNewUrlParser: true, useUnifiedTopology: true });
var db = mongoose.connection;
db.on("error", console.error.bind(console, "Connection error:"));
db.once("open", function (callback) {
    console.log("Mongo Connection Succeeded.");
});

module.exports = app;


