/**
 * Created by wang on 2015/9/22.
 */
var fs = require('fs');
var url = require('url');
exports.mainHtml = function(req, res){
    var filePath = __dirname + '/' + url.parse('index.bak.html').pathname;
    var page = fs.readFileSync(filePath);
    res.end(page);
}