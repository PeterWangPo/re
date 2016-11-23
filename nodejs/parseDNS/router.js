/**
 * Created by wang on 2015/9/22.
 */
var parseDNS = require('./parseDNS.js');
var mainHtml = require('./mainHtml.js');
exports.router = function(req, res, pathname){
    switch(pathname){
        case '/parse':
            parseDNS.parseDns(req, res);
            break;
        default :
            mainHtml.mainHtml(req, res);
    }
}