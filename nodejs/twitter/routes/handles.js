/**
 * Created by wang on 2015/10/2.
 */
var handles = {};
var con = require('./mysql/mysql.js');
//主页模块
handles.index = {};
handles.index.index = function(req,res){
    res.render('index');
}
handles.index.price = function(req,res){
    res.send('price');
}
//品牌页模块
handles.mall = {};
handles.mall.index = function(req,res){
    res.send('111');
}
handles.mall.team = function(req,res,arg){
    var path = arg + '/' + arg + '.html';
    res.render(path);
}
module.exports = handles;