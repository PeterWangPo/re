/**
 * Created by wang on 2015/9/12.
 */
var express = require('express');
var app = express();
app.listen(8000);
app.get('/',function(req,res){
    res.send('Welcome to nodjs app');
});
var twitter = [];
app.post('/send', express.bodyParser(), function(req,res){
    if(req.body && req.body.twitter){
        twitter.push(req.body.twitter);
        res.send({status: "ok", message : "get twitter ok"});
    }else{
        res.send({status: "no", message : "no twitter"});
    }
});
app.get('/twitter', function(req,res){
    res.send(twitter);
});