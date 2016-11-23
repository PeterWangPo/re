/**
 * Created by wang on 2015/8/30.
 */
var casper = require("casper").create();
casper.start("https://nodejs.org/api/http.html",function(){
    this.download("https://nodejs.org/api/http.html","nodejs-http.html");
});
casper.run();