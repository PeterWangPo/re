/**
 * Created by wang on 2015/8/30.
 */
var casper = require('casper').create();
casper.start('www.baidu.com',function(){
    this.echo(this.getTitle());
    //this.echo(this);
});
casper.thenOpen('www.hao123.com',function(){
    this.echo(this.getTitle());
});
casper.run();