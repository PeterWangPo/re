/**
 * Created by wang on 2015/9/5.
 */
var page = require('webpage').create();
page.open('https://www.baidu.com',function(){
    page.render('github.jpg');
    phantom.exit();
});