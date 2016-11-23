/**
 * Created by wang on 2015/8/30.
 */
var casper = require("casper").create();
casper.start("https://www.baidu.com");
casper.thenOpen("http://www.oicqzone.com/");
casper.thenOpen("http://www.imooc.com/");
casper.back();
casper.run(function(){
    console.log(this.getCurrentUrl());
});

