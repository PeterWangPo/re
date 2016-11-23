/**
 * Created by wang on 2015/9/3.
 */
var casper = require("casper").create();
//casper.start("https://www.baidu.com/",function(){
//    this.echo("title is" + this.evaluate(function(){
//            return document.title;
//        }),"info");
//});
casper.start("https://www.baidu.com/",function(){
    this.evaluate(function(name){
        document.querySelector("#kw").value = name;
    },"phantomjs");
    this.capture("baidu.jpg");
});
casper.run();