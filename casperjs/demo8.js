/**
 * Created by wang on 2015/8/30.
 */
var casper = require("casper").create();
casper.echo("!!!!!!!!!!!!!!!");
casper.start("http://www.imooc.com/",function(){
    if(this.exists("#js-signin-btn")){
        this.echo("open succeed");
    };
});
casper.then(function(){
    this.echo("in then 1");
    this.clickLabel("µÇÂ¼",'a');
});
casper.then(function(){

    if(this.exists("#signin")){
        this.echo("click successed");
    }else{
        this.echo("click failed");
    }
});
casper.run();