/**
 * Created by wang on 2015/8/30.
 */
var casper = require("casper").create();
casper.echo("~~~~~");
casper.start('http://www.imooc.com/',function(){
    this.echo("Open page success");
    if(this.exists("#header")){
        this.echo("found");
    }
});
casper.exit();