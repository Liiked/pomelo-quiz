var express = require('express');
var router = express.Router();
const axios = require('axios');

console.log(router);
/* GET users listing. */
router.get('/', function(req, res) {
    res.send('respond with a resource');
});

module.exports = router;
