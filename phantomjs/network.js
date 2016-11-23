/**
 * Created by wang on 2015/9/4.
 */
var page = require('webpage').create();
page.onResourceRequested = function(msg){
    console.log('Request ' + JSON.stringify(msg, undefined, 4));
};
page.onResourceReceived = function(msg){
    console.log('Receive ' + JSON.stringify(msg, undefined, 4));
};
page.open('http://phantomjs.org/quick-start.html');
//phantom.exit();