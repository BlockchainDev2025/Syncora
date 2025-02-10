const path  = require('path');
var express = require('express')
var router = express.Router()
var userApi = require('../controller/userManagement');

router.post('/createUser',userApi.addAccount);
router.get('/getUser',userApi.getAccount);
router.get('/getTransactionDetails',userApi.getTransactionDetails);
router.post('/addJSONData',userApi.solanaTransaction);
router.get('/getData',userApi.getData);
router.post('/updatePhantomTransaction',userApi.updatePhantomTransaction);
router.post('/addPointsBySyncora',userApi.addPointsBySyncora);


module.exports = router
