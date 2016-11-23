/**
 * Created by wang on 2015/8/30.
 */
var casper = require("casper").create();
var links = ['https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Using_IndexedDB',
            'http://todomvc.com/',
            'http://www.jq-school.com/',
            'https://github.com/atom/electron/tree/master/docs/api'
            ];
casper.start().each(links,function(self,link){
    self.thenOpen(link,function(){
       this.echo(this.getTitle());
    });
});
casper.run();