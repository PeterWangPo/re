var express = require('express');
var router = express.Router();
var url = require('url');
var handles = require('./handles.js');
/* GET home page. */
//router.get('/', function(req, res, next) {
//  res.render('index', { title: 'Express' });
//});
//router.get('/mall/*', function(req, res, next) {
//  var pathname = url.parse(req.url).pathname;
//  var path = pathname.split('/');
//  //var querystring = require('querystring').parse(url.parse(req.url).query);
//  var querystring = url.parse(req.url,true).query;
//  res.send(querystring);
//  //res.render('index', { title: 'Express' });
//});
router.get('*', function(req, res, next) {
  var pathname = url.parse(req.url).pathname;
  var paths = pathname.split('/');
  var controller = paths[1] || 'index';
  var action = paths[2] || 'index';
  var args = paths.slice(3);
  if(handles[controller] && handles[controller][action]){
    handles[controller][action].apply(null,[req,res].concat(args));
  }else{
    //这里可以根据用户的ip地址动态的加载对于地方的团购页面
    handles['index']['index'].apply(null,[req,res].concat(args));
  }
});
module.exports = router;
