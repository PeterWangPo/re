/**
 * Created by wang on 2015/9/4.
 */
var casper = require("casper").create();
casper.start("https://www.baidu.com/",function(){
    //this.echo(this.getElementAttribute("body","class"));
    require("utils").dump(this.getElementAttribute("div#swfsocketdiv","data-for"));
}).run();