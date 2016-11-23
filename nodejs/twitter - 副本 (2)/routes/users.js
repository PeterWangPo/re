var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource22222');
});
router.get('/cc', function(req, res, next) {
  res.send('user user');
});
module.exports = router;
