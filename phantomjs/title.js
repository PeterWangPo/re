/**
 * Created by wang on 2015/9/4.
 */
var page = require('webpage').create()
page.open('http://phantomjs.org/quick-start.html',function(status){
    if(status !== 'success'){
        console.log('open url failed');
    }else{
        var title = page.evaluate(function(){
            return document.title;
        });
        console.log(title);
        phantom.exit();
    }
});
//page.onConsoleMessage = function(msg){
//    console.log('title ' + msg);
//};
//page.open('http://phantomjs.org/quick-start.html',function(){
//   this.evaluate(function(){
//       console.log(document.title);
//   });
//    phantom.exit();
//});