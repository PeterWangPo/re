/**
 * Created by wang on 2015/10/2.
 */
var handles = {};
var con = require('./mysql/mysql.js');
//��ҳģ��
handles.index = {};
handles.index.index = function(req,res){
    res.render('index');
}
handles.index.price = function(req,res){
    res.send('price');
}
//Ʒ��ҳģ��
handles.mall = {};
handles.mall.index = function(req,res){
    res.send('111');
}
handles.mall.team = function(req,res,arg){
    var path = arg + '/' + arg + '.html';
    res.render(path);
}
module.exports = handles;