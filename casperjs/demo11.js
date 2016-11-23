/**
 * Created by wang on 2015/8/30.
 */
var casper = require("casper").create({verbose : true});
var links = ['https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Using_IndexedDB',
    'https://www.baidu.com/',
    'http://www.jq-school.com/',
    'https://github.com/atom/electron/tree/master/docs/api'
];
casper.start().eachThen(links,function(res){
    this.echo(res);
    this.thenOpen(res.data,function(res){
        //console.log("Opened",res.url);
        this.download(res.url,res.url.length+".html");
        //console.log("Opened",res.url.length);
    });
});
casper.run();