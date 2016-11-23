/**
 * Created by wang on 2015/9/20.
 */
var http = require("http");
var dns = require("dns");
var fs = require("fs");
var url = require("url");
var querystring = require("querystring");
http.createServer(function(req, res){
    var pathname = url.parse(req.url).pathname;
    req.setEncoding("utf8");
    res.writeHead(200, {'Content-type':'text/html'});
    router(req, res, pathname);
}).listen(3000, '127.0.0.1');
function router(req, res, pathname){
    switch (pathname){
        case "/parse":
            parseDNS(req, res);
            break;
        default:
            goIndex(req, res);
    }
}
function parseDNS(req, res){
    var postData = '';
    req.on('data', function(chunk){
        postData += chunk;
    });

    req.on('end', function(){
        getDNS(postData, function(domain, address){
            res.writeHead(200, {"Content-Type": "text/html"});
            res.end(JSON.stringify({
                domain: domain,
                addresses: address.join(',')
            }));
            //res.end("<html><head><meta http-equiv='content-type' content='text/html' charset='utf-8'></head><body style='text-align:center'>Domain:<span style='color:red'>" + domain + "</span> IP:<span style='color:red'>"+ address.join('.') +"</span></body></html>");
        });
    });
}
function goIndex(req, res){
    var readPath = __dirname + '/' + url.parse('index.bak.html').pathname;
    var indexPage = fs.readFileSync(readPath);
    res.end(indexPage);
}
function getDNS(postData, callback){
    var domain = querystring.parse(postData).dns2;
    dns.resolve(domain, function(err, addresses){
        if(!addresses) addresses = ['”Ú√˚≤ª¥Ê‘⁄'];
        callback(domain, addresses);
    });
}