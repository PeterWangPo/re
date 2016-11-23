/**
 * Created by wang on 2015/9/4.
 */
var casper = require('casper').create();
casper.start().repeat(3,function(){
    this.echo("repeating");
}).run();