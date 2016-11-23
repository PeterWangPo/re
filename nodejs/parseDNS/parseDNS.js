/**
 * Created by wang on 2015/9/22.
 */
var dns = require('dns');
var querystring = require('querystring');
exports.parseDns = function(req, res){
    var postData = '';
    req.on('data', function(chunk){
       postData +=chunk;
    });
    req.on('end', function(){
        getDns(postData,function(domain, address){
            res.end(JSON.stringify({
                domain : domain,
                address : address.join(',')
            }));
        });
    });
}
function getDns(postData, callback){
    var domain = querystring.parse(postData).dns2;
    dns.resolve(domain, function(err, addresses){
       if(!addresses) addresses = ['no ip'];
       else callback(domain, addresses);
    });
}