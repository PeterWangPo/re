/**
 * Created by wang on 2015/9/4.
 */
var casper = require('casper').create();
//casper.start('https://www.baidu.com',function(){
//    this.evaluate(function(){
//        __utils__.echo('injected');
//    });
//}).run();
//casper.start().then(function(){
//    require('utils').dump({k : 32});
//}).run();
//casper.start().then(function(){
//    this.echo(require('utils').fileExt('aa.txt'));
//}).run();
casper.start().then(function(){
    this.echo(require('utils').isWebPage('aa.txt'));
}).run();