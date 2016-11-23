/**
 * Created by wang on 2015/9/3.
 */
var casper = require("casper").create();
casper.start("https://www.baidu.com/",function(){
    this.echo(this.fetchText("a"));
});
casper.run();