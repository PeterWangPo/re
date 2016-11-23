/**
 * Created by wang on 2015/9/3.
 */
var casper = require("casper").create();
casper.start("https://www.baidu.com/",function(){
    this.evaluateOrDie(function(){
        return /logged in/.match(document.title);
    },"not logged");
});
casper.run();