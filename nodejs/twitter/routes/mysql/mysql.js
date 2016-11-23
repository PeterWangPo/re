/**
 * Created by wang on 2015/10/3.
 */
var mysql = require('mysql');
var helper = require('../helper/helper.js');//common functions
var config = require('./config/mysqlConfig.js');//mysql config
var db = {};
var con = mysql.createConnection(config);

db.insertData = function(data,callback){
}
db.updateData = function(){}
db.deleteData = function(){}
module.exports = db;
//con test
//con.connect(function(err){
//    if(err) console.log('mysql connection failed');
//    else console.log('mysql connection success');
//    con.query('SELECT * FROM ecs_goods where goods_id = ?',[134],function(err,result){
//        if(err) console.log('select data failed');
//        else{
//            console.log(result);
//            con.end();
//        }
//    })
//});