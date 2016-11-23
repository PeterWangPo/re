/**
 * Created by wang on 2015/8/30.
 */
var casper = require("casper").create();
casper.start("https://www.baidu.com/",function(){
    this.debugPage();
});
casper.run();