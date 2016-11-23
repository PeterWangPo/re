/**
 * Created by wang on 2015/9/13.
 */
var http = require("http");
var server = http.createServer();
var test = function(req, res){
    console.log('~~~~' + req.url);
};
server.on('request', function(req, res){
    console.log('aaaaaaa');
});
server.on('request', function(req, res){
    if(req.url != '/favicon.ico')
    console.log(req.url);
    res.end();
});
server.on('request', test);
//server.removeListener('request', test);
server.listen('8888','127.0.0.1');

