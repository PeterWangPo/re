/**
 * Created by wang on 2015/9/4.
 */
var casper = require("casper").create();
casper.start("https://www.baidu.com",function(){
    require("utils").dump(this.getElementsInfo("a").length);
}).run();