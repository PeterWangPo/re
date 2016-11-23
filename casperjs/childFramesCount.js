var casper = require("casper").create();
casper.open("http://club.kdnet.net/list.asp?boardid=1",function(){
    var t = casper.page.childFramesCount();
    this.echo(t);
}).run();