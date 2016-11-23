/**
 * Created by wang on 2015/9/4.
 */
var casper = require("casper").create({
    ViewportSize : {
        width : 800,
        height : 900
    }
});
casper.start("https://www.baidu.com/",function(){
    require("utils").dump(this.getElementBounds("form#form"));
}).run();