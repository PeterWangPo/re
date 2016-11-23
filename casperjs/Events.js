/**
 * Created by wang on 2015/9/4.
 */
var casper = require('casper').create();
//casper.on('resource.received',function(){
//    this.echo('event happened');
//}).start().then(function(){
//    this.emit('resource.received');
//}).run();
casper.on('back',function(){
    this.echo('back happened');
}).start().thenOpen('https://www.baidu.com').thenOpen('http://www.dangdang.com').back().run();
